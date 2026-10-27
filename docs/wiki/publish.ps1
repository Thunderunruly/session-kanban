#!/usr/bin/env pwsh
<#
.SYNOPSIS
Publish the Markdown sources in this folder to the GitHub Wiki.

.DESCRIPTION
Clones <owner>/<repo>.wiki.git, then copies:
  - every page in this folder except README.md (Chinese pages, Chinese file names);
  - every page in ./en (English pages, published under their English names);
then commits and pushes.

The wiki repository only exists after the first page has been created once in
the GitHub web UI: https://github.com/Thunderunruly/session-kanban/wiki

.PARAMETER Message
Commit message for the wiki update.

.PARAMETER Proxy
Optional HTTP proxy for git, e.g. http://127.0.0.1:7897. Useful when direct
connections to github.com are blocked but a local proxy is available.

.EXAMPLE
./publish.ps1
./publish.ps1 -Message "docs: update usage page"
./publish.ps1 -Proxy http://127.0.0.1:7897
#>
[CmdletBinding()]
param(
  [string]$Message = 'Update wiki from docs/wiki',
  [string]$Proxy = ''
)

$ErrorActionPreference = 'Stop'
$wikiUrl = 'https://github.com/Thunderunruly/session-kanban.wiki.git'
$source = $PSScriptRoot
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ('skb-wiki-' + [guid]::NewGuid().ToString('N'))
$gitProxy = @()
if ($Proxy) { $gitProxy = @('-c', "http.proxy=$Proxy", '-c', "https.proxy=$Proxy") }

Write-Host "Cloning $wikiUrl ..."
git @gitProxy clone --depth 1 $wikiUrl $temp
if ($LASTEXITCODE -ne 0) {
  Write-Error @'
Could not clone the wiki repository. Create the first wiki page in the browser
once, then retry:
  https://github.com/Thunderunruly/session-kanban/wiki
'@
}

try {
  Get-ChildItem -Path $source -Filter '*.md' -File |
    Where-Object { $_.Name -ne 'README.md' } |
    ForEach-Object { Copy-Item $_.FullName (Join-Path $temp $_.Name) -Force }

  $english = Join-Path $source 'en'
  if (Test-Path $english) {
    Get-ChildItem -Path $english -Filter '*.md' -File |
      ForEach-Object { Copy-Item $_.FullName (Join-Path $temp $_.Name) -Force }
  }

  Push-Location $temp
  try {
    git add -A
    $changes = git status --porcelain
    if (-not $changes) {
      Write-Host 'Wiki is already up to date.'
      return
    }
    git commit -m $Message
    git @gitProxy push origin HEAD
    if ($LASTEXITCODE -ne 0) { throw 'git push failed' }
    Write-Host 'Wiki published.'
  } finally {
    Pop-Location
  }
} finally {
  Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
}
