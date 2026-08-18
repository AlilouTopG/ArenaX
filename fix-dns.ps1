param([switch]$Silent)

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Start-Process powershell.exe -Verb RunAs -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$PSCommandPath`""
  exit
}

$ErrorActionPreference = 'Continue'
$targets = @('1.1.1.1', '8.8.8.8')

Write-Host '==================================================' -ForegroundColor Cyan
Write-Host '  ArenaX - DNS Fix & ISP Block Bypass Script' -ForegroundColor Cyan
Write-Host '  Setting DNS to 1.1.1.1 (Cloudflare) + 8.8.8.8 (Google)' -ForegroundColor Cyan
Write-Host '==================================================' -ForegroundColor Cyan

$done = @()
$fail = @()
foreach ($ad in Get-NetAdapter | Where-Object { $_.Status -eq 'Up' }) {
  try {
    Set-DnsClientServerAddress -InterfaceIndex $ad.ifIndex -ServerAddresses $targets -ErrorAction Stop
    $done += $ad.Name
  } catch { $fail += $ad.Name }
}

ipconfig /flushdns | Out-Null
Clear-DnsClientCache -ErrorAction SilentlyContinue | Out-Null
Start-Sleep -Seconds 2

Write-Host "`n[OK] DNS applied to adapters: $($done -join ', ')" -ForegroundColor Green
if ($fail.Count -gt 0) { Write-Host "[WARN] Failed adapters: $($fail -join ', ')" -ForegroundColor Yellow }

Write-Host "`n--- Current DNS servers ---" -ForegroundColor Cyan
Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses.Count -gt 0 } | ForEach-Object {
  Write-Host ("{0} (ifIndex {1}): {2}" -f $_.InterfaceAlias, $_.InterfaceIndex, ($_.ServerAddresses -join ', '))
}

Write-Host "`n--- Verification ---" -ForegroundColor Cyan
$r = Resolve-DnsName arenax-h4i.pages.dev -Type A -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress } | Select-Object -First 1
Write-Host "arenax-h4i.pages.dev resolves to: $($r.IPAddress)"

$code = curl.exe -s -o NUL -w "%{http_code}" --connect-timeout 10 --max-time 25 'https://arenax-h4i.pages.dev'
Write-Host "GET https://arenax-h4i.pages.dev => HTTP $code"
if ($code -eq '200') { Write-Host "`n[SUCCESS] ArenaX is fully reachable from this machine." -ForegroundColor Green }
else { Write-Host "`n[INFO] ArenaX unreachable ($code) - the block is at ISP routing level, not DNS." -ForegroundColor Yellow }

Write-Host "`nPress any key to close..." -NoNewline
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
