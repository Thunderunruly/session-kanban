#!/usr/bin/env pwsh
<#
.SYNOPSIS
Publish the Markdown sources in this folder to the GitHub Wiki.

.DESCRIPTION
Clones <owner>/<repo>.wiki.git, copies every page from this directory (except
README.md, which documents the workflow), then commits and pushes.

The wiki repository only exists after the first page has been created once in
the GitHub web UI: https://github.com/Thunderunruly/session-kanban/wiki

.PARAMETER Message
Commit message for the wiki update.

.EXAMPLE
./publish.ps1
./publish.ps1 -Message "docs: update usage page"
#>
[CmdletBinding()]
param(
  [string]$Message = 'Update wiki from docs/wiki'
)

$ErrorActionPreference = 'Stop'
$wikiUrl = 'https://github.com/Thunderunruly/session-kanban.wiki.git'
$source = $PSScriptRoot
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ('skb-wiki-' + [guid]::NewGuid().ToString('N'))

Write-Host "Cloning $wikiUrl ..."
git clone --depth 1 $wikiUrl $temp
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

  Push-Location $temp
  try {
    git add -A
    $changes = git status --porcelain
    if (-not $changes) {
      Write-Host 'Wiki is already up to date.'
      return
    }
    git commit -m $Message
    git push origin HEAD
    if ($LASTEXITCODE -ne 0) { throw 'git push failed' }
    Write-Host 'Wiki published.'
  } finally {
    Pop-Location
  }
} finally {
  Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
}
