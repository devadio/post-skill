# CORE Agent Kit Provider Matrix

Use this when the CORE Agent Kit is available and you need a fast dry sweep before building or sending provider-specific payloads.

## Commands

From the CORE repo:

```powershell
pnpm --filter @devad/post-agent dry:provider-matrix
pnpm --filter @devad/post-agent dry:provider-matrix -- --provider facebook_page
pnpm --filter @devad/post-agent dry:provider-matrix -- --provider youtube_channel --include-payloads
```

After package build:

```powershell
node packages\devad-post-agent\dist\cli.js provider-matrix --dry-run
node packages\devad-post-agent\dist\cli.js provider-matrix --dry-run --provider pinterest_board
```

MCP tool:

```text
post_provider_matrix_run
```

## What It Proves

- The local CORE provider-rule fixture and Agent Kit validator agree.
- Implemented variants return expected `PASS` rows.
- Intentionally unsupported variants return expected `BLOCKED` rows.
- No API key, OAuth session, `DEVAD_POST_ALLOW_WRITES`, `/posts`, `/media`, or social provider call is required.

## What It Does Not Prove

- OAuth/connect works.
- Live provider publishing works.
- External social pages show the marker.
- Billing or workspace plan gates allow a real live post.

For live proof, still use native CORE flows and external provider visibility with a unique marker.
