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
    
    # En proceso independiente, también escribir al log manual
    if ($env:PIXELPLAY_DETACHED_UPDATE -eq '1' -and $script:LogPath) {
        try {
            "$(Get-Date -Format 'HH:mm:ss'): $message" | Add-Content -LiteralPath $script:LogPath -Encoding UTF8
        } catch {}
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
    
    # Si estamos en un proceso independiente, esperar un poco para asegurar desacoplamiento
    if ($env:PIXELPLAY_DETACHED_UPDATE -eq '1') {
        Safe-WriteHost "Esperando desacoplamiento del proceso padre... (1 segundo)" "DarkGray"
        Start-Sleep -Milliseconds 1000
        Safe-WriteHost "Desacoplamiento completado. Continuando..." "Green"
    }
    
    $names = @('pixelplay launcher','Pixelplay Launcher','PixelplayLauncher','electron','electron.exe','node','node.exe','npm','npm.exe','conhost','conhost.exe')
    foreach ($n in $names) {
        Get-Process -Name $n -ErrorAction SilentlyContinue | ForEach-Object {
            # No cerrar nuestro propio proceso
            if ($_.Id -ne $PID) {
                try { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue } catch {}
            }
        }
    }
    try { Start-Process -FilePath cmd.exe -ArgumentList "/c taskkill /F /IM electron.exe /T" -WindowStyle Hidden | Out-Null } catch {}
    try { Start-Process -FilePath cmd.exe -ArgumentList "/c taskkill /F /IM pixelplay*.exe /T" -WindowStyle Hidden | Out-Null } catch {}
    try { Start-Process -FilePath cmd.exe -ArgumentList "/c taskkill /F /IM node.exe /T" -WindowStyle Hidden | Out-Null } catch {}
    Start-Sleep -Milliseconds 1500
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

# Detectar si este script se está ejecutando desde el launcher o necesita proceso independiente
$needsDetachedProcess = $false
try {
    # Método 1: Verificar proceso padre
    $parentProcess = Get-WmiObject Win32_Process -Filter "ProcessId=$PID" | ForEach-Object { Get-Process -Id $_.ParentProcessId -ErrorAction SilentlyContinue }
    if ($parentProcess -and ($parentProcess.ProcessName -match "launcher|electron|pixelplay")) {
        $needsDetachedProcess = $true
        Safe-WriteHost "Detectado proceso padre: $($parentProcess.ProcessName) (PID: $($parentProcess.Id))" "DarkGray"
    }
    
    # Método 2: Verificar si hay procesos de PixelPlay ejecutándose y no estamos en modo detached
    if (-not $needsDetachedProcess) {
        $launcherProcesses = Get-Process -Name "*launcher*", "*electron*", "*pixelplay*" -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $PID }
        if ($launcherProcesses.Count -gt 0 -and -not $env:PIXELPLAY_DETACHED_UPDATE) {
            $needsDetachedProcess = $true
            Safe-WriteHost "Detectados procesos de PixelPlay ejecutándose. Usando proceso independiente para evitar conflictos." "DarkGray"
        }
    }
} catch {}

# Si necesita proceso independiente, relanzarse
if ($needsDetachedProcess -and -not $env:PIXELPLAY_DETACHED_UPDATE) {
    Safe-WriteHost "Relanzando como proceso independiente para evitar conflictos con el launcher..." "Yellow"
    
    # Preparar argumentos para el nuevo proceso
    $scriptPath = $MyInvocation.MyCommand.Path
    if (-not $scriptPath) {
        $scriptPath = Join-Path $downloadsDir 'update.ps1'
    }
    
    Safe-WriteHost "Script path detectado: $scriptPath" "DarkGray"
    Safe-WriteHost "Existe archivo: $(Test-Path -LiteralPath $scriptPath)" "DarkGray"
    
    $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $scriptPath)
    
    # Pasar parámetros originales al nuevo proceso
    if ($PackageUrl) { $arguments += @('-PackageUrl', $PackageUrl) }
    if ($Sha256) { $arguments += @('-Sha256', $Sha256) }
    if ($SkipKill) { $arguments += '-SkipKill' }
    if ($NoViewer) { $arguments += '-NoViewer' }
    
    # Crear variable de entorno para evitar bucle infinito
    $env:PIXELPLAY_DETACHED_UPDATE = '1'
    
    try {
        # Método directo y simple: Start-Process con variable de entorno
        $env:PIXELPLAY_DETACHED_UPDATE = '1'
        
        # Preparar argumentos como string simple (SIN -NoViewer para mostrar visor)
        $argString = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
        if ($PackageUrl) { $argString += " -PackageUrl `"$PackageUrl`"" }
        if ($Sha256) { $argString += " -Sha256 `"$Sha256`"" }
        if ($SkipKill) { $argString += " -SkipKill" }
        # NO pasar -NoViewer para que se muestre el visor en vivo
        
        Safe-WriteHost "Argumentos del proceso: $argString" "DarkGray"
        
        # Crear proceso independiente CON VENTANA VISIBLE para mostrar progreso en vivo
        $pinfo = New-Object System.Diagnostics.ProcessStartInfo
        $pinfo.FileName = "powershell.exe"
        $pinfo.Arguments = $argString
        $pinfo.UseShellExecute = $true
        $pinfo.WindowStyle = "Normal"  # VENTANA NORMAL VISIBLE
        $pinfo.CreateNoWindow = $false # MOSTRAR VENTANA
        
        $newProcess = [System.Diagnostics.Process]::Start($pinfo)
        
        Safe-WriteHost "Proceso independiente iniciado (PID: $($newProcess.Id)) - VENTANA VISIBLE" "Green"
        Safe-WriteHost "Deberías ver aparecer una nueva ventana de PowerShell con el progreso..." "Yellow"
        Safe-WriteHost "Saliendo del proceso actual..." "Green"
        
        # Pequeña pausa para asegurar que el proceso se inicie
        Start-Sleep -Milliseconds 1000
        
        # Salir inmediatamente del proceso actual
        exit 0
    } catch {
        Safe-WriteHost "Error al lanzar proceso independiente: $($_.Exception.Message)" "Red"
        Safe-WriteHost "Continuando con ejecución normal..." "Yellow"
    }
}

try {
    # Debug: Mostrar información del proceso actual
    if ($env:PIXELPLAY_DETACHED_UPDATE -eq '1') {
        Safe-WriteHost "=== PROCESO INDEPENDIENTE INICIADO ===" "Green"
        Safe-WriteHost "PID: $PID" "DarkGray"
        Safe-WriteHost "Proceso padre: $(try { (Get-WmiObject Win32_Process -Filter "ProcessId=$PID").ParentProcessId } catch { 'Desconocido' })" "DarkGray"
        Safe-WriteHost "Directorio de trabajo: $(Get-Location)" "DarkGray"
    }
    
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
    
    # Asegurar que el directorio de logs existe
    try {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        Safe-WriteHost "Directorio de logs creado/verificado: $logDir" "DarkGray"
    } catch {
        Safe-WriteHost "Error creando directorio de logs: $($_.Exception.Message)" "Red"
    }
    
    $logPath = Join-Path $logDir "update_$timestamp.log"
    if ($env:PIXELPLAY_DETACHED_UPDATE -eq '1') {
        $logPath = Join-Path $logDir "update_detached_$timestamp.log"
        Safe-WriteHost "Archivo de log para proceso independiente: $logPath" "DarkGray"
    }
    
    # Inicializar logging - DESHABILITAR transcripción en proceso independiente para evitar errores 0xE9
    if ($env:PIXELPLAY_DETACHED_UPDATE -eq '1') {
        Safe-WriteHost "Transcripción DESHABILITADA en proceso independiente para evitar errores de consola." "Yellow"
        # Crear log manual simple
        try {
            "=== LOG PROCESO INDEPENDIENTE ===`nInicio: $(Get-Date)`nPID: $PID`n" | Out-File -FilePath $logPath -Encoding UTF8
            Safe-WriteHost "Log manual creado: $logPath" "DarkGray"
        } catch {
            Safe-WriteHost "Error creando log manual: $($_.Exception.Message)" "Red"
        }
    } else {
        # Solo usar transcripción en proceso principal
        try {
            Start-Transcript -LiteralPath $logPath -Force | Out-Null
            Safe-WriteHost "Transcripción iniciada en: $logPath" "DarkGray"
        } catch {
            Safe-WriteHost "Error iniciando transcripción: $($_.Exception.Message)" "Red"
            try {
                "Log iniciado: $(Get-Date)" | Out-File -FilePath $logPath -Encoding UTF8
                Safe-WriteHost "Log manual creado: $logPath" "DarkGray"
            } catch {
                Safe-WriteHost "Error crítico: No se puede crear archivo de log" "Red"
            }
        }
    }
    
    $envNoViewer = ([Environment]::GetEnvironmentVariable('PIXELPLAY_NO_VIEWER','Process') -eq '1') -or `
                   ([Environment]::GetEnvironmentVariable('PIXELPLAY_NO_VIEWER','User') -eq '1') -or `
                   ([Environment]::GetEnvironmentVariable('PIXELPLAY_NO_VIEWER','Machine') -eq '1')
    
    # En proceso independiente, NO usar visor adicional para evitar conflictos
    if ($env:PIXELPLAY_DETACHED_UPDATE -eq '1') {
        Safe-WriteHost '[VISOR] Deshabilitado en proceso independiente para evitar conflictos.' "Yellow"
        Safe-WriteHost '[PROCESO] Esta ventana MOSTRARÁ el progreso directamente.' "Green"
    } elseif (-not ($NoViewer -or $envNoViewer)) {
        Start-Viewer -downloadsDir $downloadsDir -logPath $logPath
    } else {
        Safe-WriteHost '[VISOR] Deshabilitado por parametro o variable de entorno.' "DarkYellow"
    }
    
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

    if (-not $SkipKill) { 
        Safe-WriteHost "=== INICIANDO CIERRE DE LAUNCHER ===" "Yellow"
        Kill-Launcher 
        Safe-WriteHost "=== CIERRE DE LAUNCHER COMPLETADO ===" "Green"
    }

    # Preparar rutas temporales de trabajo
    $zipPath = Join-Path $downloadsDir "update_$timestamp.zip"
    $extractDir = Join-Path $downloadsDir "update_temp_$timestamp"
    New-Item -ItemType Directory -Path $extractDir -Force | Out-Null

    # Descargar paquete
    Safe-WriteHost "=== INICIANDO DESCARGA ===" "Yellow"
    Download-Package -url $PackageUrl -destFile $zipPath
    Safe-WriteHost "=== DESCARGA COMPLETADA ===" "Green"

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
    # Solo detener transcripción si se estaba usando
    if ($env:PIXELPLAY_DETACHED_UPDATE -ne '1') {
        try { Stop-Transcript | Out-Null } catch {}
    }
    exit 0
} catch {
    $errorMsg = "Error durante la actualizacion: $($_.Exception.Message)"
    $stackTrace = $_.ScriptStackTrace
    
    # Intentar escribir error usando múltiples métodos
    try {
        Safe-WriteHost $errorMsg "Red"
    } catch {
        try {
            Write-Output $errorMsg
        } catch {
            # Fallback final
            [Console]::WriteLine($errorMsg)
        }
    }
    
    # Escribir error al log si existe
    if ($script:LogPath -and (Test-Path -LiteralPath $script:LogPath)) {
        try {
            Add-Content -LiteralPath $script:LogPath -Value "`n=== ERROR ===`n$errorMsg`n$stackTrace`n============`n" -Encoding UTF8
        } catch {}
    }
    
    # Si estamos en proceso independiente, crear un archivo de error específico
    if ($env:PIXELPLAY_DETACHED_UPDATE -eq '1') {
        try {
            $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
            $errorFile = Join-Path $downloadsDir "logs\update_detached_error_$timestamp.log"
            @"
=== ERROR EN PROCESO INDEPENDIENTE ===
Fecha: $(Get-Date)
PID: $PID
Error: $errorMsg
Stack Trace:
$stackTrace
======================================
"@ | Out-File -FilePath $errorFile -Encoding UTF8
            Safe-WriteHost "Error guardado en: $errorFile" "Yellow"
        } catch {
            [Console]::WriteLine("No se pudo crear archivo de error")
        }
    }
    
    # Solo detener transcripción si se estaba usando
    if ($env:PIXELPLAY_DETACHED_UPDATE -ne '1') {
        try { Stop-Transcript | Out-Null } catch {}
    }
    exit 1
}
