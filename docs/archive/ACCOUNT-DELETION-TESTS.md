# Account Deletion – Manual Test Checklist

## Happy path – normal user
- Go to Settings → “Delete your account”.
- Optionally enter a reason and confirm.
- See success toast, get signed out, and land on `/account-deleted`.
- (Future) Visiting your old profile shows deleted behaviour once that path is wired.

## Error path
- Simulate RPC failure (e.g., disable network or force an error).
- Confirm an error toast appears, you remain signed in, and there is no redirect.

## Export & delete interplay
- Use “Download my data (JSON)” first.
- Then request deletion; verify both flows still work and don’t interfere.
