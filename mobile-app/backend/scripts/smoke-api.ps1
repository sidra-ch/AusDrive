param(
  [string]$BaseUrl = "http://localhost:3001",
  [switch]$IncludeEmailFlow
)

$ErrorActionPreference = "Stop"

function Invoke-JsonPost {
  param(
    [string]$Uri,
    [hashtable]$Body,
    [hashtable]$Headers
  )

  $jsonBody = $Body | ConvertTo-Json

  if ($Headers) {
    return Invoke-RestMethod -Uri $Uri -Method Post -ContentType "application/json" -Body $jsonBody -Headers $Headers
  }

  return Invoke-RestMethod -Uri $Uri -Method Post -ContentType "application/json" -Body $jsonBody
}

try {
  $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get

  $stamp = Get-Date -Format "yyyyMMddHHmmss"
  $googleEmail = "smoke+$stamp@ausdrive.test"
  $googleLogin = Invoke-JsonPost -Uri "$BaseUrl/api/auth/google" -Body @{
    email = $googleEmail
    name = "Smoke User"
    googleId = "gid-$stamp"
    profileImage = $null
  }

  if (-not $googleLogin.token) {
    throw "Missing token from /api/auth/google"
  }

  $authHeaders = @{ Authorization = "Bearer $($googleLogin.token)" }
  $sessions = Invoke-RestMethod -Uri "$BaseUrl/api/sessions" -Method Get -Headers $authHeaders
  $profileResponse = Invoke-RestMethod -Uri "$BaseUrl/api/users/profile" -Method Get -Headers $authHeaders

  $result = [ordered]@{
    baseUrl = $BaseUrl
    healthStatus = $health.status
    googleLoginHasToken = [bool]$googleLogin.token
    googleLoginUserEmail = $googleLogin.user.email
    sessionsTotal = $sessions.total
    profileUserEmail = $profileResponse.user.email
    profileUserIdPresent = [bool]$profileResponse.user.id
  }

  if ($IncludeEmailFlow.IsPresent) {
    $email = "smoke.email+$stamp@ausdrive.test"
    $password = "Aa123456"

    $register = Invoke-JsonPost -Uri "$BaseUrl/api/auth/register" -Body @{
      name = "Smoke Email User"
      email = $email
      password = $password
    }

    Invoke-JsonPost -Uri "$BaseUrl/api/auth/verify-email" -Body @{
      email = $email
      code = "000000"
    } | Out-Null

    $emailLogin = Invoke-JsonPost -Uri "$BaseUrl/api/auth/login" -Body @{
      email = $email
      password = $password
    }

    $result.emailFlowRegisterMessage = $register.message
    $result.emailFlowLoginHasToken = [bool]$emailLogin.token
    $result.emailFlowLoginUserEmail = $emailLogin.user.email
  }

  $result | ConvertTo-Json -Compress
  exit 0
} catch {
  $errorResult = [ordered]@{
    baseUrl = $BaseUrl
    ok = $false
    error = $_.Exception.Message
  }

  $errorResult | ConvertTo-Json -Compress
  exit 1
}
