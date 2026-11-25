# tools/ogp.html をヘッドレスの Edge で開いて、サイト直下の ogp.png（1200×630）に書き出す
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$html = Join-Path $PSScriptRoot "ogp.html"
$out = Join-Path $root "ogp.png"
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$url = ([System.Uri]$html).AbsoluteUri

# いつもの Edge とは別の一時プロフィールで起動する（起動中の Edge に吸収されないように）
$profileDir = Join-Path $env:TEMP "uranai-ogp-edge"
# フォントの読み込みを待つため virtual-time-budget を長めにとる
$args = @(
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
  "--user-data-dir=`"$profileDir`"", "--window-size=1200,630", "--virtual-time-budget=5000",
  "--screenshot=`"$out`"", $url
)
Start-Process -FilePath $edge -ArgumentList $args -Wait -WindowStyle Hidden
if (Test-Path $out) { Write-Output "書き出しました: $out" } else { throw "ogp.png を作れませんでした" }
