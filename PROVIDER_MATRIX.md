# CORE Agent Kit Provider Matrix

Use this when the CORE Agent Kit is available and you need a fast dry sweep before building or sending provider-specific payloads.

## Commands

From the CORE repo:

```powershell
pnpm --filter @devad/post-agent dry:provider-matrix
pnpm --filter @devad/post-agent dry:provider-matrix -- --provider facebook_page
pnpm --filter @devad/post-agent dry:provider-proof:packet -- --provider pinterest_board
pnpm --filter @devad/post-agent dry:provider-matrix -- --provider youtube_channel --include-payloads
```

After package build:

```powershell
node packages\devad-post-agent\dist\cli.js provider-matrix --dry-run
node packages\devad-post-agent\dist\cli.js provider-matrix --dry-run --provider pinterest_board
node packages\devad-post-agent\dist\cli.js provider-proof:packet --dry-run --provider pinterest_board
node packages\devad-post-agent\dist\cli.js provider-rules:compare --dry-run --file saved-automation-response.json
```

MCP tool:

```text
post_provider_matrix_run
post_provider_proof_packet_build
post_provider_rules_compare
```

## What It Proves

- The local CORE provider-rule fixture and Agent Kit validator agree.
- `provider-proof:packet` can build a secret-safe provider chunk packet from local CORE provider rules before live proof.
- Implemented variants return expected `PASS` rows.
- Intentionally unsupported variants return expected `BLOCKED` rows.
- The current Agent Kit validator enforces exact MIME, supported first-comment variants, and basic media constraints when payloads include `settings.mime_type` and metadata.
- `provider-rules:compare` can prove a saved/live CORE `/automation` `provider_rules` contract still matches the local Agent Kit fixture; clean output has `summary.mismatches: 0` and `fingerprints.match: true`.
- No API key, OAuth session, `DEVAD_POST_ALLOW_WRITES`, `/posts`, `/media`, or social provider call is required.

## What It Does Not Prove

- OAuth/connect works.
- Live provider publishing works.
- External social pages show the marker.
- Billing or workspace plan gates allow a real live post.

`provider-rules:compare --live` is still read-only but does require a workspace API key because it fetches `GET /api/v1/post/automation`. It does not publish or upload media.

For live proof, still use native CORE flows and external provider visibility with a unique marker.
