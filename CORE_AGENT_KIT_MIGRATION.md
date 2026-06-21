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
3. Require `--live --confirm` and `DEVAD_POST_ALLOW_WRITES=1` for live writes.
4. Normalize old payloads into CORE-native request shape.
5. Add provider-first validation before payload build:
   - provider
   - channel
   - variant
   - media MIME/count/ratio/size/duration
   - provider-specific payload
6. Preserve CORE `block_states`, warnings, and blocking reasons.
7. Add idempotency/correlation IDs to n8n and Sheets.
8. Verify external provider URLs before marking a provider/type as passed.

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
node scripts\test_runner.js facebook_image --live --confirm
```

The final command should fail closed unless `DEVAD_POST_ALLOW_WRITES=1` and a valid `wsk_...` key are present.

```powershell
python -m py_compile scripts\test_runner.py
python scripts\test_runner.py facebook_image --print-payload
python scripts\test_runner.py facebook_image --live --confirm
```

Use the bundled Python executable on Windows if `python` is not available on PATH.

## Legacy Reference Areas

The old Google Sheet and n8n folders are retained as workflow-shape references only. They still need a full CORE migration before live use.
