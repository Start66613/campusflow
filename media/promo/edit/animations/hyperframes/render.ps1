$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

# Pin the CLI and rendering environment so the composition is repeatable.
$taskBrowser = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
if (Test-Path -LiteralPath $taskBrowser) {
  $env:HYPERFRAMES_BROWSER_PATH = $taskBrowser
}
$taskFfmpegDir = Join-Path $PSScriptRoot '../remotion/node_modules/@remotion/compositor-win32-x64-msvc'
if (Test-Path -LiteralPath (Join-Path $taskFfmpegDir 'ffmpeg.exe')) {
  $env:Path = (Resolve-Path -LiteralPath $taskFfmpegDir).Path + ';' + $env:Path
}
npx.cmd --yes hyperframes@0.8.147 check
if ($LASTEXITCODE -ne 0) { throw 'HyperFrames checks failed.' }
npx.cmd --yes hyperframes@0.8.147 render --output intro.mp4 --fps 60 --quality delivery --workers 2 --strict-all
if ($LASTEXITCODE -ne 0) { throw 'HyperFrames rendering failed.' }
