cd P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio
Write-Host "=== Live homepage contact check ===" -ForegroundColor Cyan
try {
  $r = Invoke-WebRequest -Uri "https://me.tony.do" -TimeoutSec 15 -UseBasicParsing
  Write-Host "Status: $($r.StatusCode)"
  Write-Host "Length: $($r.Content.Length)"

  # Search for contact-related strings
  $signals = @('Get In Touch', 'id="contact"', 'linkedin.com', 'WhatsApp', 'Email', 'CVData', 'hero-content', 'hero-section', 'root')
  foreach ($s in $signals) {
    $count = ([regex]::Matches($r.Content, [regex]::Escape($s))).Count
    Write-Host "  '$s': $count occurrences"
  }

  # See if app is loading
  Write-Host "`n=== Scripts loaded ==="
  $scripts = ([regex]::Matches($r.Content, 'src="[^"]*\.js"')) | ForEach-Object { $_.Value }
  $scripts | ForEach-Object { Write-Host "  $_" }
} catch {
  Write-Host "Error: $_"
}