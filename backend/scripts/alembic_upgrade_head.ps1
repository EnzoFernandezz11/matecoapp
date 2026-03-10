param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Resolve-Path (Join-Path $scriptDir "..")

Push-Location $backendDir
try {
  $env:DATABASE_URL = $DatabaseUrl
  Write-Host "Running Alembic upgrade to head..."
  Write-Host "Backend dir: $backendDir"

  alembic upgrade head

  Write-Host "Alembic upgrade completed successfully."
}
finally {
  Pop-Location
}
