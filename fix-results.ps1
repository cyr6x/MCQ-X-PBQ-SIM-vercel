$f = 'C:\Users\baaya\OneDrive\Documents\GitHub\MCQ-X-PBQ-SIM-vercel\src\components\ExamResults.tsx'
$lines = Get-Content $f
# Keep only lines 0..117 (the logic section, before the return block)
$header = $lines[0..117]
Set-Content $f $header
Write-Host "Done: kept $($header.Count) lines"
