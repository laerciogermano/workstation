# Instala o plans-client para a pessoa atual (Windows), sem administrador.
#   .\install.ps1               instala em %LOCALAPPDATA%\Plans\bin e adiciona ao PATH
#   .\install.ps1 -Uninstall    remove (-Purge apaga também a configuração)
param([switch]$Uninstall, [switch]$Purge)
$ErrorActionPreference = 'Stop'
$dest = Join-Path $env:LOCALAPPDATA 'Plans\bin'
$exe = Join-Path $dest 'plans-client.exe'
$path = [Environment]::GetEnvironmentVariable('Path', 'User')
$entries = @($path -split ';' | Where-Object { $_ })

if ($Uninstall) {
  if (Test-Path $exe) {
    if ($Purge) { & $exe unpair } else { & $exe stop }
    Remove-Item $exe -Force
  }
  [Environment]::SetEnvironmentVariable('Path', (($entries | Where-Object { $_ -ne $dest }) -join ';'), 'User')
  Write-Host 'plans-client removido.'
  return
}

New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item (Join-Path $PSScriptRoot 'plans-client.exe') $exe -Force
if ($entries -notcontains $dest) {
  [Environment]::SetEnvironmentVariable('Path', (($entries + $dest) -join ';'), 'User')
  Write-Host 'Abra um novo terminal para o PATH valer.'
}
Write-Host "Instalado em $exe ($(& $exe version))"
