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
    try {
        Write-Host "`n=====================================" -ForegroundColor Cyan
        Write-Host " $text" -ForegroundColor Yellow
        Write-Host "=====================================`n" -ForegroundColor Cyan
    } catch {
        Write-Output "`n====================================="
        Write-Output " $text"
        Write-Output "=====================================`n"
    }
}

function Safe-WriteHost($message, $color = "White") {
    try {
        Write-Host $message -ForegroundColor $color
    } catch {
        Write-Output $message
    }
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
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "           PIXELPLAY UPDATER           " -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Mostrando progreso en vivo. No cierre esta ventana...`n" -ForegroundColor DarkGray

# Esperar a que el archivo exista
while (-not (Test-Path -LiteralPath $LogPath)) { Start-Sleep -Milliseconds 200 }

# Leer contenido en vivo y dibujar barra de progreso si se emiten marcas
Get-Content -LiteralPath $LogPath -Wait | ForEach-Object {
    $line = $_
    if ($line -match '^\[PROGRESS_DOWNLOAD\]\s+(\d{1,3})$') {
        $p = [int]$Matches[1]
        if ($p -lt 0) { $p = 0 } elseif ($p -gt 100) { $p = 100 }
        try {
            Write-Progress -Activity 'Descargando actualización' -Status ("$p%") -PercentComplete $p
        } catch {
            $barLen = 30
            $filled = [int]([math]::Round(($p/100)*$barLen))
            $bar = ('#' * $filled).PadRight($barLen, '-')
            Write-Host ("[Descarga] [{0}] {1,3}%" -f $bar, $p)
        }
    } else {
        Write-Host $line
    }
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
            Safe-WriteHost ("[VISOR] No se pudo iniciar el visor: {0}" -f $_.Exception.Message) "DarkYellow"
        }
    }
}

function Kill-Launcher {
    Safe-WriteHost "Cerrando procesos de PixelPlay..." "White"
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
    Safe-WriteHost "Descargando paquete desde: $url" "White"
    Ensure-Tls12
    
    $wc = New-Object System.Net.WebClient
    $progress = 0
    $wc.add_DownloadProgressChanged({ param($s,$e)
        if ($e.TotalBytesToReceive -gt 0) {
            $pct = [int]$e.ProgressPercentage
            if ($pct -ne $progress) { $progress = $pct; Write-Progress -Activity "Descargando actualizacion" -Status "$pct%" -PercentComplete $pct; Safe-WriteHost ("[PROGRESS_DOWNLOAD] {0}" -f $pct) "White" }
        }
    })
    $wc.add_DownloadFileCompleted({ Write-Progress -Activity "Descargando actualizacion" -Completed; Safe-WriteHost "[PROGRESS_DOWNLOAD] 100" "White" })
    $wc.DownloadFileAsync([uri]$url, $destFile)
    while ($wc.IsBusy) { Start-Sleep -Milliseconds 200 }
}

function Verify-Checksum($file, $expectedSha256) {
    if (-not $expectedSha256) { return $true }
    Safe-WriteHost "Verificando checksum SHA256..." "White"
    $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $file
    if ($hash.Hash.ToLower() -ne $expectedSha256.ToLower()) { throw "Checksum invalido. Esperado: $expectedSha256, Obtenido: $($hash.Hash)" }
    Safe-WriteHost "Checksum OK" "Green"
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
        Safe-WriteHost "Obteniendo informacion de actualizacion desde: $InfoUrl" "White"
        Ensure-Tls12
        $data = Invoke-RestMethod -Uri $InfoUrl -UseBasicParsing
    } catch {
        Safe-WriteHost "No se pudo obtener powerupdate.json: $($_.Exception.Message)" "DarkYellow"
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
        Safe-WriteHost "Paquete detectado: $pkgUrl" "DarkGray"
        if ($pkgSha) { Safe-WriteHost "SHA256 detectado en metadata." "DarkGray" }
        return [pscustomobject]@{ Url = $pkgUrl; Sha256 = $pkgSha }
    }

    Safe-WriteHost "No se encontro URL de paquete en powerupdate.json" "DarkYellow"
    return $null
}

function Replace-AppContent($extractedRoot, $appDir) {
    Safe-WriteHost "Copiando nueva version (superposicion, sin borrar existentes)..." "White"
    $items = Get-ChildItem -LiteralPath $extractedRoot -Force
    foreach ($it in $items) {
        if ($it.Name -ieq 'downloads') { continue }
        if ($it.Name -ieq 'node_modules') { Safe-WriteHost "Saltando 'node_modules' para evitar bloqueos (se mantiene el actual)." "DarkGray"; continue }
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
                Safe-WriteHost ("Reintentando copiar '{0}' por bloqueo (intento {1}/{2})" -f $it.Name,$attempts,$maxAttempts) "DarkYellow"
                Start-Sleep -Milliseconds 500
            }
        } while (-not $ok -and $attempts -lt $maxAttempts)
        if (-not $ok) { Safe-WriteHost ("No se pudo copiar '{0}' tras {1} intentos." -f $it.Name,$maxAttempts) "Red" }
    }
}

try {
    Write-Section 'PIXELPLAY UPDATER'

    # Resolver rutas y preparar visor de estado y logging lo antes posible
    $paths = Resolve-Paths
    $downloadsDir = $paths.ScriptDir
    $appDir = $paths.AppDir
    $exePath = $paths.ExePath

    Safe-WriteHost "Directorio de app: $appDir" "DarkGray"
    Safe-WriteHost "Descargas: $downloadsDir" "DarkGray"  
    Safe-WriteHost "Executable: $exePath" "DarkGray"

    # Preparar rutas temporales y logging
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    $logDir = Join-Path $downloadsDir 'logs'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $logPath = Join-Path $logDir "update_$timestamp.log"
    $envNoViewer = ([Environment]::GetEnvironmentVariable('PIXELPLAY_NO_VIEWER','Process') -eq '1') -or `
                   ([Environment]::GetEnvironmentVariable('PIXELPLAY_NO_VIEWER','User') -eq '1') -or `
                   ([Environment]::GetEnvironmentVariable('PIXELPLAY_NO_VIEWER','Machine') -eq '1')
    if (-not ($NoViewer -or $envNoViewer)) {
        Start-Viewer -downloadsDir $downloadsDir -logPath $logPath
    } else {
        Safe-WriteHost '[VISOR] Deshabilitado por parametro o variable de entorno.' "DarkYellow"
    }
    try { Start-Transcript -LiteralPath $logPath -Force | Out-Null } catch {}
    $script:LogPath = $logPath

    # Si no se pasó PackageUrl, NO autodetectar desde powerupdate.json; usar URL embebida/env
    if ([string]::IsNullOrWhiteSpace($PackageUrl)) {
        Safe-WriteHost 'No se proporciono -PackageUrl, usando la URL por defecto embebida (o variables de entorno si existen)...' "DarkYellow"
    }

    # Fallback: usar SIEMPRE la URL embebida del bucket cuando no se pasa -PackageUrl
    if ([string]::IsNullOrWhiteSpace($PackageUrl)) {
        $PackageUrl = $DefaultPackageUrl
        Safe-WriteHost "Usando paquete por defecto (bucket): $PackageUrl" "White"
    }

    if ([string]::IsNullOrWhiteSpace($PackageUrl)) {
        throw 'No se pudo determinar la URL del paquete. Proporcione -PackageUrl o defina correctamente $DefaultPackageUrl en el script.'
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
    Safe-WriteHost "Extrayendo paquete..." "White"
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
    Safe-WriteHost 'Relanzando PixelPlay...' "White"
    if (Test-Path -LiteralPath $exePath) {
        Start-Process -FilePath $exePath -WorkingDirectory (Split-Path -Parent $exePath)
        Safe-WriteHost 'PixelPlay lanzado.' "Green"
    } else {
        Safe-WriteHost 'No se encontro el ejecutable en la ruta esperada:' "Red"
        Safe-WriteHost $exePath "DarkRed"
    }
    try { Stop-Transcript | Out-Null } catch {}
    exit 0
} catch {
    try {
        Write-Output "Error durante la actualizacion: $($_.Exception.Message)"
    } catch {
        # Fallback si incluso Write-Output falla
        [Console]::WriteLine("Error durante la actualizacion: $($_.Exception.Message)")
    }
    try { Stop-Transcript | Out-Null } catch {}
    exit 1
}
