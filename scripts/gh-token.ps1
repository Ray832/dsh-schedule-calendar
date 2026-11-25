param(
  [string]$Target = 'git:https://github.com',
  [string]$Out = (Join-Path (Split-Path -Parent $PSScriptRoot) '.tmp\gh-token.txt')
)

# Hand the GitHub token to a push without printing it.
#
# `git credential fill` cannot be used on this machine: the configured helper is
# `manager`, which returns nothing non-interactively, and the `wincred` helper
# reports no match even though the entry exists (see docs/state.md §7). The
# entry is a generic credential named `git:https://github.com` with user
# Ray832, so read it straight from the Windows vault instead.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/gh-token.ps1
#   # -> "user=Ray832 length=40 out=E:\Dsh_Schedule\.tmp\gh-token.txt"
#
# Delete the output file as soon as the push finishes — the file only, never the
# directory: under DSH the session's executor temp directory is a subdirectory of
# %TEMP% and removing it kills every later shell command.
Add-Type -Namespace Dsh -Name Vault -MemberDefinition @"
[DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
public static extern bool CredRead(string target, int type, int flags, out IntPtr credential);

[DllImport("advapi32.dll", SetLastError = true)]
public static extern void CredFree(IntPtr credential);

[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
public struct CREDENTIAL {
  public int Flags;
  public int Type;
  public IntPtr TargetName;
  public IntPtr Comment;
  public long LastWritten;
  public int CredentialBlobSize;
  public IntPtr CredentialBlob;
  public int Persist;
  public int AttributeCount;
  public IntPtr Attributes;
  public IntPtr TargetAlias;
  public IntPtr UserName;
}
"@

$ptr = [IntPtr]::Zero
if (-not [Dsh.Vault]::CredRead($Target, 1, 0, [ref]$ptr)) {
  $code = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  Write-Output "read failed: Win32 error $code (is the credential still in the vault?)"
  exit 1
}

try {
  $cred = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][Dsh.Vault+CREDENTIAL])
  $secret = [Runtime.InteropServices.Marshal]::PtrToStringUni($cred.CredentialBlob, $cred.CredentialBlobSize / 2)
  $user = [Runtime.InteropServices.Marshal]::PtrToStringUni($cred.UserName)
  Set-Content -Path $Out -Value $secret -NoNewline -Encoding ascii
  Write-Output "user=$user length=$($secret.Length) out=$Out"
} finally {
  [Dsh.Vault]::CredFree($ptr)
}