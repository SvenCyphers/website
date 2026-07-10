param(
  [switch]$Strict
)

$ErrorActionPreference = "Stop"

function Add-Finding {
  param(
    [string]$Level,
    [string]$Path,
    [string]$Message
  )

  $script:Findings += [pscustomobject]@{
    Level = $Level
    Path = $Path
    Message = $Message
  }
}

function Read-TextFile {
  param([string]$Path)
  return [System.IO.File]::ReadAllText($Path)
}

function Get-RepoRelativePath {
  param([string]$Path)
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $root = [System.IO.Path]::GetFullPath($repoRoot).TrimEnd("\", "/")
  if ($fullPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $fullPath.Substring($root.Length).TrimStart("\", "/").Replace("\", "/")
  }
  return $fullPath.Replace("\", "/")
}

function Test-Pattern {
  param(
    [string]$Path,
    [string]$Content,
    [string]$Pattern,
    [string]$Message,
    [string]$Level = "FAIL"
  )

  if ($Content -match $Pattern) {
    Add-Finding -Level $Level -Path $Path -Message $Message
  }
}

$repoRoot = (git rev-parse --show-toplevel).Trim()
Set-Location $repoRoot
$Findings = @()

Write-Host "Security check: git diff whitespace"
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$diffCheck = & git diff --check 2>&1
$diffCheckExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorActionPreference
if ($diffCheckExitCode -ne 0) {
  Add-Finding -Level "FAIL" -Path "git diff --check" -Message ($diffCheck -join "`n")
}

$customRoots = @(
  "functions",
  "beheer",
  "artikel",
  ".github",
  "scripts"
)

$customRootFiles = @(
  "contact-form-handler.js",
  "home-demo-mode.js",
  "home-logo-carousel.js",
  "home-logo-carousel.css",
  "knowledgebase-dynamic.js",
  "knowledgebase-dynamic.css",
  "schema.sql",
  "README.md"
)

$files = New-Object System.Collections.Generic.List[string]
foreach ($root in $customRoots) {
  if (Test-Path $root) {
    Get-ChildItem $root -Recurse -File | ForEach-Object {
      $files.Add($_.FullName)
    }
  }
}
foreach ($file in $customRootFiles) {
  if (Test-Path $file) {
    $files.Add((Resolve-Path $file).Path)
  }
}

$files = $files | Sort-Object -Unique

$secretPatterns = @(
  @{ Pattern = "-----BEGIN (RSA |OPENSSH |EC |DSA |)PRIVATE KEY-----"; Message = "Private key lijkt in de repository te staan." },
  @{ Pattern = "sk-[A-Za-z0-9_-]{20,}"; Message = "Mogelijke API key gevonden." },
  @{ Pattern = "Bearer\s+[A-Za-z0-9._~+/-]{30,}"; Message = "Mogelijke bearer token gevonden." },
  @{ Pattern = "(?i)(cloudflare|github|openai|api|auth|admin|secret|password)[A-Z0-9_\- ]{0,24}[:=]\s*['""][^'""]{12,}['""]"; Message = "Mogelijke hardcoded secret of wachtwoord gevonden." }
)

Write-Host "Security check: custom files"
foreach ($absolutePath in $files) {
  $relativePath = Get-RepoRelativePath $absolutePath
  $extension = [System.IO.Path]::GetExtension($absolutePath).ToLowerInvariant()
  $size = (Get-Item $absolutePath).Length

  if ($size -gt 5MB) {
    Add-Finding -Level "FAIL" -Path $relativePath -Message "Custom bestand is groter dan 5MB. Grote assets horen niet ongemerkt in codewijzigingen."
  }

  if ($extension -notin @(".js", ".html", ".css", ".sql", ".md", ".yml", ".yaml", ".ps1")) {
    continue
  }

  $content = Read-TextFile $absolutePath

  foreach ($secret in $secretPatterns) {
    Test-Pattern -Path $relativePath -Content $content -Pattern $secret.Pattern -Message $secret.Message
  }

  if ($extension -eq ".js") {
    Test-Pattern -Path $relativePath -Content $content -Pattern "\beval\s*\(" -Message "Gebruik van eval() is geblokkeerd."
    Test-Pattern -Path $relativePath -Content $content -Pattern "\bnew\s+Function\s*\(" -Message "Gebruik van new Function() is geblokkeerd."
    Test-Pattern -Path $relativePath -Content $content -Pattern "document\.write\s*\(" -Message "document.write() is risicovol en geblokkeerd."
    Test-Pattern -Path $relativePath -Content $content -Pattern "Access-Control-Allow-Origin['""]?\s*:\s*['""]?\*" -Message "Wildcard CORS is niet toegestaan."
    Test-Pattern -Path $relativePath -Content $content -Pattern "console\.(log|debug|info)\([^)]*(ADMIN_PASSWORD|AUTH_SECRET|context\.env|token|password)" -Message "Mogelijk gevoelige logging gevonden."

    if ($content -match "\.innerHTML\s*=" -and $content -notmatch "escapeHtml|safeContent|template\.innerHTML") {
      Add-Finding -Level "WARN" -Path $relativePath -Message "innerHTML gebruikt zonder duidelijke escaping/sanitizing in hetzelfde bestand."
    }

    if ($content -match "localStorage" -and $relativePath -notmatch "^beheer/") {
      Add-Finding -Level "WARN" -Path $relativePath -Message "localStorage buiten beheer gevonden; controleer of er geen gevoelige data wordt opgeslagen."
    }
  }

  if ($extension -eq ".html" -and $relativePath -match "^(beheer|artikel)/") {
    Test-Pattern -Path $relativePath -Content $content -Pattern "\son[a-z]+\s*=" -Message "Inline event handler in custom HTML gevonden."
  }
}

Write-Host "Security check: admin API auth"
$adminFiles = @()
if (Test-Path "functions/api/admin") {
  $adminFiles = Get-ChildItem "functions/api/admin" -File -Filter "*.js"
}

foreach ($file in $adminFiles) {
  $relativePath = Get-RepoRelativePath $file.FullName
  $content = Read-TextFile $file.FullName
  if ($file.Name -eq "login.js") {
    if ($content -notmatch "validateAdminPassword" -or $content -notmatch "assertLoginAllowed") {
      Add-Finding -Level "FAIL" -Path $relativePath -Message "Admin login mist wachtwoordvalidatie of rate limiting."
    }
    continue
  }
  if ($content -notmatch "requireAdmin") {
    Add-Finding -Level "FAIL" -Path $relativePath -Message "Admin API mist requireAdmin()."
  }
}

Write-Host "Security check: known hardening hooks"
$httpPath = Join-Path $repoRoot "functions/_lib/http.js"
if (Test-Path $httpPath) {
  $http = Read-TextFile $httpPath
  if ($http -match "error\.message" -and $http -match "return json") {
    Add-Finding -Level "FAIL" -Path "functions/_lib/http.js" -Message "serverError lijkt interne foutmeldingen naar clients te lekken."
  }
  if ($http -notmatch "x-content-type-options" -or $http -notmatch "no-store") {
    Add-Finding -Level "WARN" -Path "functions/_lib/http.js" -Message "JSON security/cache headers ontbreken mogelijk."
  }
}

$articlePath = Join-Path $repoRoot "artikel/article.js"
if (Test-Path $articlePath) {
  $article = Read-TextFile $articlePath
  if ($article -notmatch "safeContent" -or $article -notmatch "script, iframe, object, embed") {
    Add-Finding -Level "FAIL" -Path "artikel/article.js" -Message "Artikelcontent mist duidelijke client-side sanitizing."
  }
}

$failures = @($Findings | Where-Object { $_.Level -eq "FAIL" })
$warnings = @($Findings | Where-Object { $_.Level -eq "WARN" })

if ($Findings.Count -gt 0) {
  Write-Host ""
  Write-Host "Security check findings:"
  foreach ($finding in $Findings) {
    Write-Host ("[{0}] {1}: {2}" -f $finding.Level, $finding.Path, $finding.Message)
  }
}

if ($failures.Count -gt 0 -or ($Strict -and $warnings.Count -gt 0)) {
  Write-Host ""
  Write-Host "Security check failed."
  exit 1
}

Write-Host "Security check passed."
if ($warnings.Count -gt 0) {
  Write-Host ("Warnings: {0}" -f $warnings.Count)
}
