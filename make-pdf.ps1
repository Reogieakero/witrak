$ErrorActionPreference = "Stop"
$src = "C:\Fhusocom\student-flows.txt"
$out = "C:\Fhusocom\student-flows.pdf"

$lines = Get-Content -LiteralPath $src

# PDF building helpers (minimal, single font, Helvetica)
function Encode-String([string]$s) {
    # escape (, ) and backslash for PDF literal strings
    $s = $s -replace '\\', '\\'
    $s = $s -replace '\(', '\('
    $s = $s -replace '\)', '\)'
    return $s
}

$objects = @()

# We'll build content stream with text lines.
$contentLines = @()
$contentLines += "BT"
$contentLines += "/F1 11 Tf"
$contentLines += "1 0 0 1 54 790 Tm"   # start position (x=54, y=790)
$contentLines += "14 TL"               # leading

foreach ($line in $lines) {
    if ($line -eq "") {
        $contentLines += "T*"
        continue
    }
    # wrap long lines at ~95 chars
    $chunks = @()
    $tmp = $line
    while ($tmp.Length -gt 95) {
        $cut = 95
        while ($cut -gt 0 -and $tmp[$cut] -ne ' ') { $cut-- }
        if ($cut -eq 0) { $cut = 95 }
        $chunks += $tmp.Substring(0, $cut)
        $tmp = $tmp.Substring($cut).TrimStart()
    }
    $chunks += $tmp
    foreach ($c in $chunks) {
        $contentLines += "($(Encode-String $c)) Tj"
        $contentLines += "T*"
    }
}
$contentLines += "ET"

$contentStream = $contentLines -join "`n"

# Build objects
# 1: catalog, 2: pages, 3: page, 4: content, 5: font
$objects = @()
$objects += "<< /Type /Catalog /Pages 2 0 R >>"                                       # 1
$objects += "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"                              # 2
$objects += "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>"  # 3
$objects += "<< /Length $($contentStream.Length) >>`nstream`n$contentStream`nendstream"  # 4
$objects += "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"                  # 5

# Assemble PDF with xref
$sb = [System.Text.StringBuilder]::new()
$sb.Append("`%PDF-1.4`n") | Out-Null

$offsets = @()
$body = ""
$objNum = 1
foreach ($obj in $objects) {
    $offsets += $body.Length
    $body += "$objNum 0 obj`n$obj`nendobj`n"
    $objNum++
}

$sb.Append($body) | Out-Null
$xrefPos = $body.Length
$count = $objects.Count + 1
$sb.Append("xref`n0 $count`n") | Out-Null
$sb.Append("0000000000 65535 f`n") | Out-Null
foreach ($off in $offsets) {
    $sb.Append("{0:0000000000} 00000 n`n" -f $off) | Out-Null
}
$sb.Append("trailer`n<< /Size $count /Root 1 0 R >>`n") | Out-Null
$sb.Append("startxref`n$xrefPos`n`%EOF`n") | Out-Null

[System.IO.File]::WriteAllText($out, $sb.ToString(), [System.Text.Encoding]::GetEncoding("ASCII"))
Write-Output "PDF written to $out ($([System.IO.File]::ReadAllBytes($out).Length) bytes)"
