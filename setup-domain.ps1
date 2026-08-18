param(
  [string]$Domain = "arenax.io",
  [string]$Project = "arenax",
  [string]$PagesUrl = "arenax-h4i.pages.dev"
)

# Prerequisites: $env:CF_TOKEN (Cloudflare API token), $env:CF_ACCOUNT (account id)
# Steps (run after you own the domain at the registrar):
#  1) Cloudflare dashboard > Add a site (zone) for arenax.io > copy nameservers to your registrar
#  2) Wait until zone Status = Active (can take up to 24h, usually minutes)
#  3) Run:  .\setup-domain.ps1   (or pass -Domain / -Project)

$ErrorActionPreference = 'Stop'
$token = $env:CF_TOKEN
if (-not $token) { Write-Host "[ERROR] Set env CF_TOKEN first" -ForegroundColor Red; exit 1 }

$headers = @{ Authorization = "Bearer $token" }
$base = "https://api.cloudflare.com/client/v4"

function Api-Call([string]$method, [string]$url, [hashtable]$body = $null) {
  if ($body) { $json = $body | ConvertTo-Json -Depth 6 }
  $args = @{ Uri = $url; Method = $method; Headers = $headers; ContentType = 'application/json'; TimeoutSec = 30 }
  if ($body) { $args.Body = $json }
  $r = Invoke-RestMethod @args
  if (-not $r.success) { throw "API error: $($r.errors | ConvertTo-Json -Compress)" }
  return $r.result
}

Write-Host "===== ArenaX Custom Domain setup: $Domain =====" -ForegroundColor Cyan

# 1) Find the zone
$zone = $null
foreach ($page in 1..5) {
  $zones = Api-Call 'GET' "$base/zones?name=$Domain&page=$page&per_page=50"
  foreach ($z in $zones) { if ($z.name -eq $Domain) { $zone = $z; break } }
  if ($zone) { break }
  if ($zones.Count -lt 50) { break }
}
if (-not $zone) { throw "Zone $Domain not found. Add it in Cloudflare dashboard first (Add a site)." }
Write-Host "[1/6] Zone found: $($zone.id) status=$($zone.status)" -ForegroundColor Green
if ($zone.status -ne 'active') { Write-Host "[WARN] Zone not active yet. Set the nameservers at your registrar, then wait." -ForegroundColor Yellow }

# 2) Add custom domain to Pages project
$existing = Api-Call 'GET' "$base/accounts/$($env:CF_ACCOUNT)/pages/projects/$Project/domains"
$has = @($existing | Where-Object { $_.name -eq $Domain }).Count -gt 0
if (-not $has) {
  $new = Api-Call 'POST' "$base/accounts/$($env:CF_ACCOUNT)/pages/projects/$Project/domains" @{ name = $Domain }
  Write-Host "[2/6] Custom domain added: $Domain (status=$($new.status))" -ForegroundColor Green
} else {
  Write-Host "[2/6] Custom domain already added." -ForegroundColor Green
}

# 3) Poll until active (CNAME created automatically when zone is on same account)
Write-Host "[3/6] Waiting for domain to become active..."
foreach ($i in 1..60) {
  Start-Sleep -Seconds 10
  try {
    $domains = Api-Call 'GET' "$base/accounts/$($env:CF_ACCOUNT)/pages/projects/$Project/domains"
    $mine = $domains | Where-Object { $_.name -eq $Domain }
    if ($mine -and $mine.status -eq 'active') { Write-Host "[3/6] Domain ACTIVE - https://$Domain is live!" -ForegroundColor Green; break }
    Write-Host "    ... still pending ($i/60)"
  } catch { Write-Host "    ... retry ($i/60)" }
}
if (-not ($mine -and $mine.status -eq 'active')) { throw "Domain still pending after 10 min. Check DNS records for $Domain (should CNAME to $PagesUrl)." }

# 4) Swap pages.dev -> custom domain in frontend files
Write-Host "[4/6] Updating frontend URLs to https://$Domain ..." -ForegroundColor Green
$files = @('frontend/index.html', 'frontend/public/sitemap.xml', 'frontend/public/robots.txt')
foreach ($f in $files) {
  $p = Join-Path $PWD $f
  if (Test-Path $p) {
    $c = Get-Content $p -Raw
    $c = $c.Replace("https://$PagesUrl", "https://$Domain")
    [System.IO.File]::WriteAllText($p, $c, (New-Object System.Text.UTF8Encoding $false))
  }
}

# 5) Update CORS on Render backend
Write-Host "[5/6] Updating Render CORS_ORIGINS..."
$renderToken = $env:RENDER_API_KEY
if ($renderToken) {
  $svc = $env:RENDER_SERVICE_ID
  if (-not $svc) { throw "Set RENDER_SERVICE_ID" }
  $cors = $null
  $rh = @{ Authorization = "Bearer $renderToken" }
  $envs = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$svc/env-vars" -Headers $rh
  foreach ($e in $envs) { if ($e.envVarKey -eq 'CORS_ORIGINS') { $cors = $e } }
  $origins = @("https://$Domain")
  if ($cors) {
    $origins = @($cors.envVarValue -split ',') + @("https://$Domain") | Select-Object -Unique
  }
  $body = @{ envVarKey = 'CORS_ORIGINS'; envVarValue = ($origins -join ',') } | ConvertTo-Json
  Invoke-RestMethod -Uri "https://api.render.com/v1/services/$svc/env-vars/CORS_ORIGINS" -Method PUT -Headers $rh -ContentType 'application/json' -Body $body
  $deploy = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$svc/deploys" -Method POST -Headers $rh -ContentType 'application/json' -Body '{}'
  Write-Host "[5/6] Render redeploying: $($deploy.id)" -ForegroundColor Green
}

# 6) Commit + push (auto-deploy pipeline takes over)
Write-Host "[6/6] Committing and pushing..."
$git = 'C:\Program Files\Git\cmd\git.exe'
& $git add frontend/index.html frontend/public/sitemap.xml frontend/public/robots.txt
& $git commit -m "domain: switch to custom domain https://$Domain"
& $git push origin main

Write-Host "`n===== DONE: https://$Domain is now the official ArenaX domain =====" -ForegroundColor Green
Write-Host "Next: Google Search Console > add property (Domain) > arenax.io > verify via DNS TXT (auto via Cloudflare) > submit sitemap."
