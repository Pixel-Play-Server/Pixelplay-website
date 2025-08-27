param(
    [string]$PackageUrl = "",
    [string]$Sha256 = "",
    [switch]$SkipKill,
    [switch]$NoViewer
)

$ErrorActionPreference = 'Stop'
${global:ProgressPreference} = 'SilentlyContinue'

# SHA256 por defecto embebido (se utiliza si no se pasa -Sha256)
$DefaultSha256 = "CE824B6D4F3B01BBC15DEFDCA839607F127495399C2C031690BD54C446793A72"
# Nota: No asignamos $Sha256 automáticamente para evitar falsos negativos
# con paquetes nuevos. Si se desea forzar, pase -Sha256 explícitamente.

# URL de paquete por defecto (fallback), alojado en Cloudflare R2
$DefaultPackageUrl = "https://pub-dda9306a363141bc9aece427638fbb4a.r2.dev/pixelplay-app-20250825180136.zip"

function Write-Section($text) {
    Write-Host "`n=====================================" -ForegroundColor Cyan
    Write-Host " $text" -ForegroundColor Yellow
    Write-Host "=====================================`n" -ForegroundColor Cyan
}

function Ensure-Tls12 {
    try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}
}

function Resolve-Paths {
    # Resolver directorio del script de forma robusta
    $scriptDir = $null
    try { if ($PSScriptRoot) { $scriptDir = $PSScriptRoot } } catch {}
    if (-not $scriptDir) {
        $scriptPath = $null
        try { $scriptPath = $PSCommandPath } catch {}
        if (-not $scriptPath) { try { $scriptPath = $MyInvocation.MyCommand.Path } catch {} }
        if (-not $scriptPath -or -not (Test-Path -LiteralPath $scriptPath)) { $scriptPath = (Get-Location).Path }
        $scriptDir = Split-Path -Parent $scriptPath
        if (-not $scriptDir) { $scriptDir = (Get-Location).Path }
    }

    # Derivar rutas relativas al directorio del script
    $appDir    = Resolve-Path (Join-Path $scriptDir '..') | ForEach-Object { $_.Path }        # .../resources/app
    $resources = Resolve-Path (Join-Path $appDir '..') | ForEach-Object { $_.Path }           # .../resources
    $install   = Resolve-Path (Join-Path $resources '..') | ForEach-Object { $_.Path }        # .../Pixelplay Launcher (instalación)
    $exePath   = Join-Path $install 'pixelplay launcher.exe'
    [pscustomobject]@{ ScriptDir=$scriptDir; AppDir=$appDir; ResourcesDir=$resources; InstallDir=$install; ExePath=$exePath }
}

function Ensure-ViewerScript($downloadsDir) {
    $viewerPath = Join-Path $downloadsDir 'update-viewer.ps1'
    $content = @'
param(
    [Parameter(Mandatory = $true)] [string]$LogPath,
    [string]$Title = "PixelPlay Updater"
)

try {
    $Host.UI.RawUI.WindowTitle = $Title
} catch {}

# Ajustar codificación y silenciar Write-Progress
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
$ProgressPreference = 'SilentlyContinue'

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "           PIXELPLAY UPDATER           " -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Mostrando progreso en vivo. No cierre esta ventana...`n" -ForegroundColor DarkGray

# Esperar a que el archivo exista
while (-not (Test-Path -LiteralPath $LogPath)) { Start-Sleep -Milliseconds 200 }

# Leer contenido en vivo y mostrar barra ASCII en lugar de Write-Progress (evita problemas de tuberías)
try {
    Get-Content -LiteralPath $LogPath -Wait -ReadCount 1 | ForEach-Object {
        $line = $_
        if ($line -match '^\[PROGRESS_DOWNLOAD\]\s+(\d{1,3})$') {
            $p = [int]$Matches[1]
            if ($p -lt 0) { $p = 0 } elseif ($p -gt 100) { $p = 100 }
            $barLen = 30
            $filled = [int]([math]::Round(($p/100)*$barLen))
            $bar = ('#' * $filled).PadRight($barLen, '-')
            Write-Host ("[Descarga] [{0}] {1,3}%" -f $bar, $p)
        } else {
            Write-Host $line
        }
    }
} catch {
    Write-Host "[VISOR] Error leyendo el log: $($_.Exception.Message)" -ForegroundColor DarkYellow
}
'@
    # Siempre sobreescribir para garantizar versión actualizada del visor
    Set-Content -LiteralPath $viewerPath -Value $content -Encoding UTF8 -Force
    return $viewerPath
}

function Start-Viewer($downloadsDir, $logPath) {
    $viewer = Ensure-ViewerScript -downloadsDir $downloadsDir
    $pwsh = Join-Path $env:WINDIR 'System32/WindowsPowerShell/v1.0/powershell.exe'
    if (-not (Test-Path -LiteralPath $pwsh)) { $pwsh = 'powershell.exe' }
    try {
        # Intento 1: lanzar directamente PowerShell en nueva ventana (ShellExecute)
        $args = @('-NoProfile','-NoLogo','-ExecutionPolicy','Bypass','-File', $viewer, '-LogPath', $logPath, '-Title', 'PixelPlay Updater')
        Start-Process -FilePath $pwsh -ArgumentList $args -WorkingDirectory $downloadsDir -WindowStyle Normal -Verb Open | Out-Null
    } catch {
        try {
            # Fallback: usar cmd /c start con título de ventana
            $cmdArgs = ('/c start "PixelPlay Updater" "{0}" -NoProfile -NoLogo -ExecutionPolicy Bypass -File "{1}" -LogPath "{2}" -Title "PixelPlay Updater"' -f $pwsh, $viewer, $logPath)
            Start-Process -FilePath 'cmd.exe' -ArgumentList $cmdArgs -WorkingDirectory $downloadsDir -WindowStyle Hidden | Out-Null
        } catch {
            Write-Host ("[VISOR] No se pudo iniciar el visor: {0}" -f $_.Exception.Message) -ForegroundColor DarkYellow
        }
    }
}

function Kill-Launcher {
    Write-Host "Cerrando procesos de PixelPlay..." -ForegroundColor White
    $names = @('pixelplay launcher','Pixelplay Launcher','PixelplayLauncher','electron','electron.exe','node','node.exe','npm','npm.exe','conhost','conhost.exe')
    foreach ($n in $names) {
        Get-Process -Name $n -ErrorAction SilentlyContinue | ForEach-Object {
            try { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue } catch {}
        }
    }
    try { Start-Process -FilePath cmd.exe -ArgumentList "/c taskkill /F /IM electron.exe /T" -WindowStyle Hidden | Out-Null } catch {}
    try { Start-Process -FilePath cmd.exe -ArgumentList "/c taskkill /F /IM pixelplay*.exe /T" -WindowStyle Hidden | Out-Null } catch {}
    try { Start-Process -FilePath cmd.exe -ArgumentList "/c taskkill /F /IM node.exe /T" -WindowStyle Hidden | Out-Null } catch {}
    Start-Sleep -Milliseconds 1200
}

function Download-Package($url, $destFile) {
    Write-Host "Descargando paquete desde:" $url -ForegroundColor White
    Ensure-Tls12
    $uri = [uri]$url
    if ($uri.Host -like '*drive.google.com') {
        return Download-GDriveLargeFile -url $url -destFile $destFile
    }

    $wc = New-Object System.Net.WebClient
    $progress = 0
    $wc.add_DownloadProgressChanged({ param($s,$e)
        if ($e.TotalBytesToReceive -gt 0) {
            $pct = [int]$e.ProgressPercentage
            if ($pct -ne $progress) { $progress = $pct; Write-Progress -Activity "Descargando actualización" -Status "$pct%" -PercentComplete $pct; Write-Host ("[PROGRESS_DOWNLOAD] {0}" -f $pct) }
        }
    })
    $wc.add_DownloadFileCompleted({ Write-Progress -Activity "Descargando actualización" -Completed; Write-Host "[PROGRESS_DOWNLOAD] 100" })
    $wc.DownloadFileAsync([uri]$url, $destFile)
    while ($wc.IsBusy) { Start-Sleep -Milliseconds 200 }
}

function Download-GDriveLargeFile($url, $destFile) {
    Write-Host "Detección Google Drive: manejando token de confirmación..." -ForegroundColor DarkYellow
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $fileId = $null
    try {
        $u = [uri]$url
        $qs = [System.Web.HttpUtility]::ParseQueryString($u.Query)
        if ($qs['id']) { $fileId = $qs['id'] }
        if (-not $fileId) {
            if ($u.AbsolutePath -match '/file/d/([^/]+)') { $fileId = $Matches[1] }
        }
    } catch {}
    if (-not $fileId) { throw 'No se pudo extraer el ID de archivo de Google Drive.' }

    $initialUrl = "https://drive.google.com/uc?export=download&id=$fileId"
    $headers = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36' }
    $resp1 = Invoke-WebRequest -Uri $initialUrl -WebSession $session -UseBasicParsing -Headers $headers
    $content = $resp1.Content

    $downloadSucceeded = $false

    if (-not $downloadSucceeded) {
        # Intento con confirm token en uc?export (regex/cookies)
        $token = $null
        if ($content -and $content -match 'confirm=([0-9A-Za-z_\-]+)') { $token = $Matches[1] }
        if (-not $token -and $content -and $content -match 'href=\"/uc\?export=download&confirm=([0-9A-Za-z_\-]+)&id=') { $token = $Matches[1] }
        try {
            if (-not $token) {
                $cookies = $session.Cookies.GetCookies('https://drive.google.com')
                foreach ($c in $cookies) { if ($c.Name -like 'download_warning*') { $token = $c.Value; break } }
            }
        } catch {}
        $downloadUrl = if ($token) { "https://drive.google.com/uc?export=download&confirm=$token&id=$fileId" } else { $initialUrl }
        if (-not $token) { Write-Host 'No se encontró token de confirmación; intentando descargar igualmente...' -ForegroundColor DarkYellow }
        Write-Host "Descargando desde URL confirmada..." -ForegroundColor White
        try {
            Invoke-DownloadWithProgress -Url $downloadUrl -Destination $destFile -Headers $headers
            $downloadSucceeded = (Test-Path -LiteralPath $destFile) -and ((Get-Item -LiteralPath $destFile).Length -gt 0) -and (Test-IsZip -file $destFile)
        } catch {}
    }

    if (-not $downloadSucceeded) {
        # 3) Intento alternativo directo a drive.usercontent.google.com con progreso y cabeceras
        Write-Host 'El archivo descargado no parece ser un ZIP válido, reintentando con endpoint alternativo...' -ForegroundColor DarkYellow
        $confirmVal = if ($token) { $token } else { '' }
        $altUrl = if ($confirmVal) { "https://drive.usercontent.google.com/download?id=$fileId&export=download&confirm=$confirmVal" } else { "https://drive.usercontent.google.com/download?id=$fileId&export=download" }
        try { Remove-Item -LiteralPath $destFile -Force -ErrorAction SilentlyContinue } catch {}
        Invoke-DownloadWithProgress -Url $altUrl -Destination $destFile -Headers $headers
        $downloadSucceeded = (Test-Path -LiteralPath $destFile) -and ((Get-Item -LiteralPath $destFile).Length -gt 0) -and (Test-IsZip -file $destFile)
    }

    if (-not $downloadSucceeded) {
        Write-Host 'No se pudo descargar automáticamente. Intentando asistencia manual...' -ForegroundColor DarkYellow
        $manualUrl = Prompt-ForDriveDownloadUrl -initialUrl $initialUrl
        if ($manualUrl) {
            try { Remove-Item -LiteralPath $destFile -Force -ErrorAction SilentlyContinue } catch {}
            Invoke-DownloadWithProgress -Url $manualUrl -Destination $destFile -Headers $headers
            $downloadSucceeded = (Test-Path -LiteralPath $destFile) -and ((Get-Item -LiteralPath $destFile).Length -gt 0) -and (Test-IsZip -file $destFile)
        }
    }

    if (-not $downloadSucceeded) {
        throw 'La descarga desde Google Drive no devolvió un archivo ZIP válido. Es posible que Google haya respondido con una página HTML de advertencia.'
    }
}

function Prompt-ForDriveDownloadUrl {
    param([Parameter(Mandatory=$true)][string]$initialUrl)
    try {
        Add-Type -AssemblyName System.Windows.Forms | Out-Null
        Add-Type -AssemblyName System.Drawing | Out-Null

        $form = New-Object System.Windows.Forms.Form
        $form.Text = 'Confirmación de descarga - Google Drive'
        $form.Width = 600; $form.Height = 220
        $form.StartPosition = 'CenterScreen'

        $label = New-Object System.Windows.Forms.Label
        $label.AutoSize = $true
        $label.Text = '1) Clic en "Abrir página" y en la web pulsa "Descargar de todos modos". 2) Copia la dirección del enlace final de descarga y pégala aquí:'
        $label.Top = 10; $label.Left = 10; $label.Width = 560
        $form.Controls.Add($label)

        $text = New-Object System.Windows.Forms.TextBox
        $text.Left = 10; $text.Top = 60; $text.Width = 560
        $form.Controls.Add($text)

        $btnOpen = New-Object System.Windows.Forms.Button
        $btnOpen.Text = 'Abrir página'; $btnOpen.Left = 10; $btnOpen.Top = 100; $btnOpen.Width = 120
        $btnOpen.Add_Click({ Start-Process $initialUrl })
        $form.Controls.Add($btnOpen)

        $btnOk = New-Object System.Windows.Forms.Button
        $btnOk.Text = 'Continuar'; $btnOk.Left = 450; $btnOk.Top = 100; $btnOk.Width = 120
        $btnOk.Add_Click({ $form.DialogResult = [System.Windows.Forms.DialogResult]::OK; $form.Close() })
        $form.AcceptButton = $btnOk
        $form.Controls.Add($btnOk)

        if ($form.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { return $null }
        $u = $text.Text.Trim()
        if (-not $u) { return $null }
        try { $uri = [uri]$u } catch { return $null }
        if ($uri.Host -notlike '*googleusercontent.com' -and $uri.Host -notlike '*drive.google.com' -and $uri.Host -notlike '*drive.usercontent.google.com') { return $null }
        return $u
    } catch {
        return $null
    }
}

function Invoke-DownloadWithProgress {
    param(
        [Parameter(Mandatory=$true)] [string]$Url,
        [Parameter(Mandatory=$true)] [string]$Destination,
        [hashtable]$Headers
    )
    try {
        $request = [System.Net.HttpWebRequest]::Create($Url)
        $request.Method = 'GET'
        if ($Headers) { foreach ($k in $Headers.Keys) { if ($k -ieq 'User-Agent') { $request.UserAgent = [string]$Headers[$k] } else { $request.Headers[[string]$k] = [string]$Headers[$k] } } }
        $response = $request.GetResponse()
        $total = $response.ContentLength
        $stream = $response.GetResponseStream()
        $fs = New-Object System.IO.FileStream($Destination, [System.IO.FileMode]::Create)
        $buffer = New-Object byte[] 65536
        $read = 0
        $downloaded = 0
        $lastPct = -1
        while (($read = $stream.Read($buffer, 0, $buffer.Length)) -gt 0) {
            $fs.Write($buffer, 0, $read)
            $downloaded += $read
            if ($total -gt 0) {
                $pct = [int]([math]::Floor(($downloaded * 100.0) / $total))
                if ($pct -ne $lastPct) {
                    $lastPct = $pct
                    Write-Progress -Activity 'Descargando actualización' -Status ("$pct%") -PercentComplete $pct
                    Write-Host ("[PROGRESS_DOWNLOAD] {0}" -f $pct)
                }
            }
        }
        $fs.Close(); $stream.Close(); $response.Close()
        Write-Host "[PROGRESS_DOWNLOAD] 100"
    } catch {
        throw $_
    }
}

function Verify-Checksum($file, $expectedSha256) {
    if (-not $expectedSha256) { return $true }
    Write-Host "Verificando checksum SHA256..." -ForegroundColor White
    $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $file
    if ($hash.Hash.ToLower() -ne $expectedSha256.ToLower()) { throw "Checksum inválido. Esperado: $expectedSha256, Obtenido: $($hash.Hash)" }
    Write-Host "Checksum OK" -ForegroundColor Green
    $true
}

function Test-IsZip($file) {
    try {
        if (-not (Test-Path -LiteralPath $file)) { return $false }
        $fi = [System.IO.File]::OpenRead($file)
        try {
            $sig = New-Object byte[] 4
            [void]$fi.Read($sig, 0, 4)
            $fi.Close()
            # 'PK\x03\x04' firma ZIP
            return ($sig[0] -eq 0x50 -and $sig[1] -eq 0x4B -and $sig[2] -eq 0x03 -and $sig[3] -eq 0x04)
        } finally {
            if ($fi) { $fi.Dispose() }
        }
    } catch { return $false }
}

function Get-UpdateInfo {
    param(
        [string]$InfoUrl = "https://pixelplay.gg/powerupdate.json"
    )
    try {
        Write-Host "Obteniendo información de actualización desde:" $InfoUrl -ForegroundColor White
        Ensure-Tls12
        $data = Invoke-RestMethod -Uri $InfoUrl -UseBasicParsing
    } catch {
        Write-Host "No se pudo obtener powerupdate.json: $($_.Exception.Message)" -ForegroundColor DarkYellow
        return $null
    }

    $pkgUrl = $null
    $pkgSha = $null

    try { if ($data.current_package -is [System.Array] -and $data.current_package.Count -gt 0) { $pkgUrl = $data.current_package[0].url; $pkgSha = $data.current_package[0].sha256 } } catch {}
    if (-not $pkgUrl) { try { $pkgUrl = $data.current_package.url; if (-not $pkgSha) { $pkgSha = $data.current_package.sha256 } } catch {} }
    if (-not $pkgUrl) { try { $pkgUrl = $data.package.url; if (-not $pkgSha) { $pkgSha = $data.package.sha256 } } catch {} }
    if (-not $pkgUrl) { try { $pkgUrl = $data.packageUrl; if (-not $pkgSha) { $pkgSha = $data.sha256 } } catch {} }
    if (-not $pkgUrl) { try { $pkgUrl = $data.current_script[0].package.url; if (-not $pkgSha) { $pkgSha = $data.current_script[0].package.sha256 } } catch {} }
    if (-not $pkgUrl) { try { $pkgUrl = $data.current_script[0].packageUrl; if (-not $pkgSha) { $pkgSha = $data.current_script[0].sha256 } } catch {} }
    if (-not $pkgUrl) { try { $pkgUrl = $data.current_script[0].zipUrl } catch {} }

    if ($pkgUrl) {
        Write-Host "Paquete detectado:" $pkgUrl -ForegroundColor DarkGray
        if ($pkgSha) { Write-Host "SHA256 detectado en metadata." -ForegroundColor DarkGray }
        return [pscustomobject]@{ Url = $pkgUrl; Sha256 = $pkgSha }
    }

    Write-Host "No se encontró URL de paquete en powerupdate.json" -ForegroundColor DarkYellow
    return $null
}

function Replace-AppContent($extractedRoot, $appDir) {
    Write-Host "Copiando nueva versión (superposición, sin borrar existentes)..." -ForegroundColor White
    $items = Get-ChildItem -LiteralPath $extractedRoot -Force
    foreach ($it in $items) {
        if ($it.Name -ieq 'downloads') { continue }
        if ($it.Name -ieq 'node_modules') { Write-Host "Saltando 'node_modules' para evitar bloqueos (se mantiene el actual)." -ForegroundColor DarkGray; continue }
        $dest = Join-Path $appDir $it.Name
        $attempts = 0
        $maxAttempts = 5
        do {
            try {
                Copy-Item -LiteralPath $it.FullName -Destination $dest -Recurse -Force -ErrorAction Stop
                $ok = $true
            } catch {
                $ok = $false
                $attempts++
                Write-Host ("Reintentando copiar '{0}' por bloqueo (intento {1}/{2})" -f $it.Name,$attempts,$maxAttempts) -ForegroundColor DarkYellow
                Start-Sleep -Milliseconds 500
            }
        } while (-not $ok -and $attempts -lt $maxAttempts)
        if (-not $ok) { Write-Host ("No se pudo copiar '{0}' tras {1} intentos." -f $it.Name,$maxAttempts) -ForegroundColor Red }
    }
}

try {
    Write-Section 'PIXELPLAY UPDATER'

    # Resolver rutas y preparar visor de estado y logging lo antes posible
    $paths = Resolve-Paths
    $downloadsDir = $paths.ScriptDir
    $appDir = $paths.AppDir
    $exePath = $paths.ExePath

    Write-Host "Directorio de app:" $appDir -ForegroundColor DarkGray
    Write-Host "Descargas:" $downloadsDir -ForegroundColor DarkGray
    Write-Host "Executable:" $exePath -ForegroundColor DarkGray

    # Preparar rutas temporales y logging
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    $logDir = Join-Path $downloadsDir 'logs'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $logPath = Join-Path $logDir "update_$timestamp.log"
    $envNoViewer = ([Environment]::GetEnvironmentVariable('PIXELPLAY_NO_VIEWER','Process') -eq '1') -or \
                   ([Environment]::GetEnvironmentVariable('PIXELPLAY_NO_VIEWER','User') -eq '1') -or \
                   ([Environment]::GetEnvironmentVariable('PIXELPLAY_NO_VIEWER','Machine') -eq '1')
    if (-not ($NoViewer -or $envNoViewer)) {
        Start-Viewer -downloadsDir $downloadsDir -logPath $logPath
    } else {
        Write-Host '[VISOR] Deshabilitado por parámetro o variable de entorno.' -ForegroundColor DarkYellow
    }
    try { Start-Transcript -LiteralPath $logPath -Force | Out-Null } catch {}
    $script:LogPath = $logPath

    # Si no se pasó PackageUrl, intentar autodetectar desde powerupdate.json
    if ([string]::IsNullOrWhiteSpace($PackageUrl)) {
        Write-Host 'No se proporcionó -PackageUrl, intentando autodetectar...' -ForegroundColor DarkYellow
        $info = Get-UpdateInfo
        if ($info -and $info.Url) {
            $PackageUrl = $info.Url
            if ([string]::IsNullOrWhiteSpace($Sha256) -and $info.Sha256) { $Sha256 = $info.Sha256 }
        }
    }

    # Fallback adicional: variable de entorno y valor por defecto
    if ([string]::IsNullOrWhiteSpace($PackageUrl)) { $envUrl = [Environment]::GetEnvironmentVariable('PIXELPLAY_PACKAGE_URL','Process'); if ($envUrl) { $PackageUrl = $envUrl } }
    if ([string]::IsNullOrWhiteSpace($PackageUrl)) { $envUrl = [Environment]::GetEnvironmentVariable('PIXELPLAY_PACKAGE_URL','User'); if ($envUrl) { $PackageUrl = $envUrl } }
    if ([string]::IsNullOrWhiteSpace($PackageUrl)) { $envUrl = [Environment]::GetEnvironmentVariable('PIXELPLAY_PACKAGE_URL','Machine'); if ($envUrl) { $PackageUrl = $envUrl } }
    if ([string]::IsNullOrWhiteSpace($PackageUrl)) { $PackageUrl = $DefaultPackageUrl }

    if ([string]::IsNullOrWhiteSpace($PackageUrl)) {
        throw 'No se pudo determinar la URL del paquete. Proporcione -PackageUrl, configure PIXELPLAY_PACKAGE_URL o asegúrese de que powerupdate.json incluya el enlace del paquete.'
    }

    if (-not $SkipKill) { Kill-Launcher }

    # Preparar rutas temporales de trabajo
    $zipPath = Join-Path $downloadsDir "update_$timestamp.zip"
    $extractDir = Join-Path $downloadsDir "update_temp_$timestamp"
    New-Item -ItemType Directory -Path $extractDir -Force | Out-Null

    # Descargar paquete
    Download-Package -url $PackageUrl -destFile $zipPath

    # Verificar checksum si se pasó
    Verify-Checksum -file $zipPath -expectedSha256 $Sha256 | Out-Null

    # Extraer paquete
    if (-not (Test-IsZip -file $zipPath)) {
        throw 'El archivo descargado no es un ZIP válido. Aborting extracción.'
    }
    Write-Host "Extrayendo paquete..." -ForegroundColor White
    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractDir -Force

    # Detectar carpeta raíz extraída (si el zip tiene carpeta contenedora)
    $extractedRoot = $extractDir
    $children = Get-ChildItem -LiteralPath $extractDir
    if ($children.Count -eq 1 -and $children[0].PSIsContainer) { $extractedRoot = $children[0].FullName }

    # Reemplazar contenido de resources/app preservando downloads
    Replace-AppContent -extractedRoot $extractedRoot -appDir $appDir

    # Limpieza
    Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $extractDir -Recurse -Force -ErrorAction SilentlyContinue

    Write-Section 'ACTUALIZACIÓN COMPLETADA'
    Write-Host 'Relanzando PixelPlay...' -ForegroundColor White
    if (Test-Path -LiteralPath $exePath) {
        Start-Process -FilePath $exePath -WorkingDirectory (Split-Path -Parent $exePath)
        Write-Host 'PixelPlay lanzado.' -ForegroundColor Green
    } else {
        Write-Host 'No se encontró el ejecutable en la ruta esperada:' -ForegroundColor Red
        Write-Host $exePath -ForegroundColor DarkRed
    }
    try { Stop-Transcript | Out-Null } catch {}
    exit 0
} catch {
    Write-Host "❌ Error durante la actualización: $($_.Exception.Message)" -ForegroundColor Red
    try { Stop-Transcript | Out-Null } catch {}
    exit 1
}


