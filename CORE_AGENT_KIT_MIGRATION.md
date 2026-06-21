# CORE Agent Kit Migration

This repo used to describe the old POST.devad.io public API flow. Current Devad POST automation should use the native CORE POST Agent Kit.

## Current Target

| Item | Required value |
|---|---|
| API base | `https://devad.io/api/v1/post` |
| Auth | `Authorization: Bearer wsk_...` |
| Secret location | environment, n8n credentials, Apps Script properties, or private runtime config only |
| Default mode | dry-run |
| Live writes | require explicit user approval, `DEVAD_POST_ALLOW_WRITES=1`, and `confirm` |
| Limits | enforced by CORE POST plans, quota, throttles, idempotency, and provider rules |
| Retry key | use `--idempotency-key`, MCP `idempotency_key`, or row-based Sheet/n8n keys |
| Rule catalog | inspect with Agent Kit `provider-rules` / MCP `post_provider_rules_get` before payload build |
| Preflight | run Agent Kit `validate` / `post_dry_run_validate`; create-post also blocks `BLOCKED` provider media-rule results before writes |
| Template drift | run `pnpm --filter @devad/post-agent verify:template-preflight` after CORE provider-rule or Sheet/n8n preflight edits |

## Do Not Reintroduce

- `https://post.devad.io/api/public/v1` as the active API base
- `X-Api-Token`
- `?api_token=...`
- tokens in prompts, URLs, screenshots, payload files, or logs
- live publishing by default
- direct provider API calls from scripts, Sheets, n8n, or MCP
- broad provider support claims without CORE/API proof

## Migration Order

1. Update docs and prompts to CORE API and bearer `wsk_...` auth.
2. Make every script dry-run by default.
3. Require `--live --confirm`, `DEVAD_POST_ALLOW_WRITES=1`, and a stable idempotency key for live writes.
4. Normalize old payloads into CORE-native request shape.
5. Query the provider-rule catalog before payload build when Agent Kit is available.
6. Add provider-first validation before payload build:
   - provider
   - channel
   - variant
   - media MIME/count/ratio/size/duration
   - provider-specific payload
7. Run Agent Kit `validate` / MCP `post_dry_run_validate` where available, and rely on `posts:create` preflight to block `BLOCKED` provider media-rule mismatches.
8. Preserve CORE `block_states`, Agent Kit `validation.provider_results`, warnings, and blocking reasons.
9. Add idempotency/correlation IDs to n8n and Sheets.
10. Run the template drift gate when Sheet/n8n embedded preflight maps or provider-rule fixtures change.
11. Verify external provider URLs before marking a provider/type as passed.

## Provider Baseline

| Provider | Current conservative stance |
|---|---|
| Facebook Page | feed text/link, image feed, video feed, reel, story image/video, first comment where supported |
| Instagram Business | image feed, video/reel shared to feed, story image/video; story comments/carousel need current CORE proof |
| LinkedIn Page | text and single image only until future slices prove more |
| Telegram | text, photo, video, document |
| YouTube | video upload only |
| Pinterest | image Pin unless current CORE/API proof says more |
| Google Business Profile | STANDARD local post only unless current CORE proof says more |
| TikTok | fail closed without creator-info, privacy, commercial disclosure, AIGC, and app-approval gates |
| X, Reddit, OK, Threads, Instagram Unofficial | code-only unless explicitly re-approved for live testing |

## Verification Commands

```powershell
node --check scripts\test_runner.js
node scripts\test_runner.js facebook_image --print-payload
node scripts\test_runner.js facebook_image --live --confirm --idempotency-key row-42-facebook-image
```

The final command should fail closed unless `DEVAD_POST_ALLOW_WRITES=1`, a stable idempotency key, and a valid `wsk_...` key are present.

When running inside the CORE monorepo, also verify Agent Kit preflight:

```powershell
node packages\devad-post-agent\dist\cli.js validate --dry-run --file packages\devad-post-agent\examples\create-post.native.json
node packages\devad-post-agent\dist\cli.js provider-rules --dry-run --provider pinterest_board
node packages\devad-post-agent\dist\cli.js posts:create --dry-run --file packages\devad-post-agent\examples\create-post.native.json
node packages\devad-post-agent\dist\mcp.js --list-tools
pnpm --filter @devad/post-agent verify:template-preflight
```

```powershell
python -m py_compile scripts\test_runner.py
python scripts\test_runner.py facebook_image --print-payload
python scripts\test_runner.py facebook_image --live --confirm --idempotency-key row-42-facebook-image
```

Use the bundled Python executable on Windows if `python` is not available on PATH.

## Legacy Reference Areas

The old Google Sheet and n8n folders are retained as workflow-shape references only. They still need a full CORE migration before live use.
