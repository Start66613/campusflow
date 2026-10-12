$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:HYPERFRAMES_BROWSER_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
npx.cmd --yes hyperframes@0.8.147 preview --background --no-open --port 3004
npx.cmd --yes hyperframes@0.8.147 preview --status
