param(
    [Parameter(Mandatory = $true)] [string]$PackageUrl,
    [string]$Sha256 = "",
    [switch]$SkipKill
)

$ErrorActionPreference = 'Stop'

# SHA256 por defecto embebido (se utiliza si no se pasa -Sha256)
$DefaultSha256 = "CE824B6D4F3B01BBC15DEFDCA839607F127495399C2C031690BD54C446793A72"
if ([string]::IsNullOrWhiteSpace($Sha256)) {
    $Sha256 = $DefaultSha256
}

function Write-Section($text) {
    Write-Host "`n=====================================" -ForegroundColor Cyan
    Write-Host " $text" -ForegroundColor Yellow
    Write-Host "=====================================`n" -ForegroundColor Cyan
}

function Ensure-Tls12 {
    try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}
}

function Resolve-Paths {
    $scriptPath = $MyInvocation.MyCommand.Path
    $scriptDir = Split-Path -Parent $scriptPath                              # .../resources/app/downloads
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

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "           PIXELPLAY UPDATER           " -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Mostrando progreso en vivo. No cierre esta ventana...`n" -ForegroundColor DarkGray

# Esperar a que el archivo exista
while (-not (Test-Path -LiteralPath $LogPath)) { Start-Sleep -Milliseconds 200 }

# Mostrar contenido en vivo
Get-Content -LiteralPath $LogPath -Wait
'@
    if (-not (Test-Path -LiteralPath $viewerPath)) {
        Set-Content -LiteralPath $viewerPath -Value $content -Encoding UTF8 -Force
    }
    return $viewerPath
}

function Start-Viewer($downloadsDir, $logPath) {
    $viewer = Ensure-ViewerScript -downloadsDir $downloadsDir
    $args = "-NoProfile -ExecutionPolicy Bypass -NoExit -File `"$viewer`" -LogPath `"$logPath`" -Title `"PixelPlay Updater`""
    Start-Process -FilePath "powershell.exe" -ArgumentList $args -WindowStyle Normal | Out-Null
}

function Kill-Launcher {
    Write-Host "Cerrando procesos de PixelPlay..." -ForegroundColor White
    $names = @('pixelplay launcher','Pixelplay Launcher','PixelplayLauncher')
    foreach ($n in $names) {
        Get-Process -Name $n -ErrorAction SilentlyContinue | ForEach-Object {
            try { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue } catch {}
        }
    }
    Start-Sleep -Milliseconds 800
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
            if ($pct -ne $progress) { $progress = $pct; Write-Progress -Activity "Descargando actualización" -Status "$pct%" -PercentComplete $pct }
        }
    })
    $wc.add_DownloadFileCompleted({ Write-Progress -Activity "Descargando actualización" -Completed })
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
    $resp1 = Invoke-WebRequest -Uri $initialUrl -WebSession $session -UseBasicParsing
    $content = $resp1.Content
    $token = $null
    if ($content -match 'confirm=([0-9A-Za-z_\-]+)') { $token = $Matches[1] }
    if (-not $token) {
        $cookies = $session.Cookies.GetCookies('https://drive.google.com')
        foreach ($c in $cookies) { if ($c.Name -like 'download_warning*') { $token = $c.Value; break } }
    }
    if (-not $token) { Write-Host 'No se encontró token de confirmación; intentando descargar igualmente...' -ForegroundColor DarkYellow }

    $downloadUrl = if ($token) { "https://drive.google.com/uc?export=download&confirm=$token&id=$fileId" } else { $initialUrl }
    Write-Host "Descargando desde URL confirmada..." -ForegroundColor White
    Invoke-WebRequest -Uri $downloadUrl -WebSession $session -OutFile $destFile -UseBasicParsing
    if (-not (Test-Path -LiteralPath $destFile) -or (Get-Item -LiteralPath $destFile).Length -eq 0) {
        throw 'La descarga desde Google Drive falló o devolvió un archivo vacío.'
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

function Replace-AppContent($extractedRoot, $appDir) {
    Write-Host "Preparando reemplazo de archivos..." -ForegroundColor White
    # Preservar carpeta downloads
    Get-ChildItem -LiteralPath $appDir -Force | Where-Object { $_.Name -ne 'downloads' } | ForEach-Object {
        try { Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction Stop } catch {}
    }

    Write-Host "Copiando nueva versión..." -ForegroundColor White
    # Copiar todo excepto la carpeta downloads del paquete
    $items = Get-ChildItem -LiteralPath $extractedRoot -Force
    foreach ($it in $items) {
        if ($it.Name -ieq 'downloads') { continue }
        $dest = Join-Path $appDir $it.Name
        Copy-Item -LiteralPath $it.FullName -Destination $dest -Recurse -Force
    }
}

try {
    Write-Section 'PIXELPLAY UPDATER'
    if (-not $PackageUrl) { throw 'Debe especificar -PackageUrl con la URL del ZIP del root (resources/app) actualizado.' }

    $paths = Resolve-Paths
    $downloadsDir = $paths.ScriptDir
    $appDir = $paths.AppDir
    $exePath = $paths.ExePath

    Write-Host "Directorio de app:" $appDir -ForegroundColor DarkGray
    Write-Host "Descargas:" $downloadsDir -ForegroundColor DarkGray
    Write-Host "Executable:" $exePath -ForegroundColor DarkGray

    if (-not $SkipKill) { Kill-Launcher }

    # Preparar rutas temporales
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    # Preparar logging y visor
    $logDir = Join-Path $downloadsDir 'logs'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $logPath = Join-Path $logDir "update_$timestamp.log"
    # Lanzar visor en nueva ventana
    Start-Viewer -downloadsDir $downloadsDir -logPath $logPath
    # Iniciar transcripción para que el visor muestre el progreso
    try { Start-Transcript -LiteralPath $logPath -Force | Out-Null } catch {}

    $zipPath = Join-Path $downloadsDir "update_$timestamp.zip"
    $extractDir = Join-Path $downloadsDir "update_temp_$timestamp"
    New-Item -ItemType Directory -Path $extractDir -Force | Out-Null

    # Descargar paquete
    Download-Package -url $PackageUrl -destFile $zipPath

    # Verificar checksum si se pasó
    Verify-Checksum -file $zipPath -expectedSha256 $Sha256 | Out-Null

    # Extraer paquete
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


