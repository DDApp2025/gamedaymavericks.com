# ============================================================
#  build-local.ps1
#  Pulls the Jekyll-built pages from the live GitHub Pages site
#  into ./_localpreview and rewrites the "/gamedaymavericks.com"
#  base path to "/" so it serves cleanly at http://localhost.
#
#  Run this once, then start the server with:  node serve.js
#  Re-run it after you push .html / Liquid changes (give Pages a
#  minute to rebuild first).
# ============================================================
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$live = "https://ddapp2025.github.io/gamedaymavericks.com"
$out  = Join-Path $root "_localpreview"
$enc  = New-Object System.Text.UTF8Encoding($false)

if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force -Path $out | Out-Null

# live path  ->  local file (relative to _localpreview)
$routes = [ordered]@{
  "/"                 = "index.html"
  "/cart/"            = "cart/index.html"
  "/checkout-demo/"   = "checkout-demo/index.html"
  "/success/"         = "success/index.html"
  "/cancel/"          = "cancel/index.html"
  "/about/"           = "about/index.html"
  "/services/"        = "services/index.html"
}
foreach ($s in @("all","sports","baseball","football","basketball","hockey","soccer","racing","combat-sports","pokemon","tcg","graded","supplies")) {
  $routes["/collections/$s/"] = "collections/$s/index.html"
}
foreach ($n in 1..12) {
  $id = "prod_{0:D3}" -f $n
  $routes["/products/$id/"] = "products/$id/index.html"
}

$count = 0
foreach ($r in $routes.Keys) {
  $url = $live + $r
  try {
    $html = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30).Content
  } catch {
    Write-Warning "Could not fetch $url : $($_.Exception.Message)"
    continue
  }
  # Rewrite base path so it works at localhost root.
  $html = $html -replace [regex]::Escape('baseurl: "/gamedaymavericks.com"'), 'baseurl: ""'
  $html = $html.Replace('/gamedaymavericks.com/', '/')

  $dest = Join-Path $out $routes[$r]
  New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
  [System.IO.File]::WriteAllText($dest, $html, $enc)
  $count++
}

Write-Output "Wrote $count pages to $out"
Write-Output "Assets are served live from .\assets by serve.js"
Write-Output "Start the preview with:  node serve.js"
