param(
  [string]$VariantsRoot = "public/portal/arcade/variants",
  [string]$OutputRoot = "public/portal/arcade/loops"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw "ffmpeg was not found on PATH."
}

$games = @(
  "monte-o-prompt",
  "verdade-ou-mito",
  "qual-prompt",
  "palpite-30s",
  "batalha-prompts",
  "caca-prompt"
)

$variantNumbers = @(1, 3, 5, 7, 1)
New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

foreach ($game in $games) {
  $inputs = @()
  foreach ($variant in $variantNumbers) {
    $path = Join-Path $VariantsRoot "$game/variant-$($variant.ToString('00')).webp"
    if (-not (Test-Path -LiteralPath $path)) {
      throw "Missing generated variant: $path"
    }
    $inputs += @("-loop", "1", "-t", "2", "-i", $path)
  }

  $filters = @()
  for ($index = 0; $index -lt $variantNumbers.Count; $index++) {
    $filters += "[$($index):v]scale=640:360:force_original_aspect_ratio=increase,crop=640:360,fps=24,format=yuv420p,setpts=PTS-STARTPTS[v$index]"
  }
  $filters += "[v0][v1]xfade=transition=fade:duration=0.5:offset=1.5[x1]"
  $filters += "[x1][v2]xfade=transition=fade:duration=0.5:offset=3.0[x2]"
  $filters += "[x2][v3]xfade=transition=fade:duration=0.5:offset=4.5[x3]"
  $filters += "[x3][v4]xfade=transition=fade:duration=0.5:offset=6.0[out]"

  $output = Join-Path $OutputRoot "$game.webm"
  & ffmpeg -hide_banner -loglevel error -y @inputs `
    -filter_complex ($filters -join ";") -map "[out]" -t 8 -an `
    -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 -deadline good -cpu-used 3 $output

  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed while building $output"
  }
  Write-Host "Built $output"
}

