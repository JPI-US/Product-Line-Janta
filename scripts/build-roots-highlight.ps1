# Builds public/marketing/roots/roots-highlight.mp4 from jantagm.com Vimeo field series.
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Tmp = Join-Path $Root "tmp\roots-video"
$Out = Join-Path $Root "public\marketing\roots\roots-highlight.mp4"
$Poster = Join-Path $Root "public\marketing\roots\roots-highlight-poster.jpg"
$SegmentsFile = Join-Path $Root "src\marketing\website\rootsFilmSegments.json"
$YtDlp = Join-Path $PSScriptRoot "yt-dlp.exe"
$Ffmpeg = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty FullName
if (-not $Ffmpeg) { throw "ffmpeg not found" }
if (-not (Test-Path $SegmentsFile)) { throw "Missing $SegmentsFile" }

New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $Out) | Out-Null

if (-not (Test-Path $YtDlp)) {
  Invoke-WebRequest -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile $YtDlp
}

$env:PATH = "$(Split-Path $Ffmpeg -Parent);$env:PATH"

$sourceUrls = @{
  needs = "https://vimeo.com/455526777"
  hope  = "https://vimeo.com/455527822"
  light = "https://vimeo.com/455528055"
}

$segments = Get-Content -Raw -Path $SegmentsFile | ConvertFrom-Json

function Get-MergedRaw([string]$id, [string]$url) {
  $merged = Join-Path $Tmp "$id-merged.mp4"
  if (Test-Path $merged) { return $merged }

  $video = Get-ChildItem (Join-Path $Tmp "$id-raw.fhls*.mp4") -ErrorAction SilentlyContinue | Select-Object -First 1
  $audio = Get-ChildItem (Join-Path $Tmp "$id-raw.fdash*.m4a") -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($video -and $audio) {
    & $Ffmpeg -y -i $video.FullName -i $audio.FullName -c copy $merged
    return $merged
  }

  $single = Get-ChildItem (Join-Path $Tmp "$id-raw.mp4") -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($single) { return $single.FullName }

  & $YtDlp -f "bv*+ba/b" --merge-output-format mp4 --ffmpeg-location (Split-Path $Ffmpeg -Parent) `
    -o (Join-Path $Tmp "$id-raw.%(ext)s") $url
  return Get-MergedRaw $id $url
}

$parts = @()
$index = 0
foreach ($segment in $segments) {
  $source = [string]$segment.source
  if (-not $sourceUrls.ContainsKey($source)) {
    throw "Unknown segment source '$source'"
  }

  $raw = Get-MergedRaw $source $sourceUrls[$source]
  $part = Join-Path $Tmp ("seg-{0:D2}-{1}.mp4" -f $index, $source)
  $dur = [math]::Max(1, [double]$segment.end - [double]$segment.start)
  & $Ffmpeg -y -ss ([double]$segment.start) -i $raw -t $dur `
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" `
    -c:v libx264 -crf 22 -preset medium -c:a aac -ar 48000 -ac 2 -b:a 160k `
    -movflags +faststart $part
  if (-not (Test-Path $part)) { throw "Failed to create $part" }
  $parts += $part
  $index += 1
}

$list = Join-Path $Tmp "concat.txt"
($parts | ForEach-Object { "file '$($_ -replace '\\','/')'" }) | Set-Content -Path $list -Encoding ascii
& $Ffmpeg -y -f concat -safe 0 -i $list -c copy -movflags +faststart $Out
& $Ffmpeg -y -ss 4 -i $Out -frames:v 1 -q:v 2 $Poster
Write-Output "Wrote $Out ($($parts.Count) segments)"
