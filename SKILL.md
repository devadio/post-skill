---
name: post-api
description: "Use the native Devad CORE POST Agent Kit to validate, schedule, and publish social content through https://devad.io/api/v1/post. Defaults to dry-run and requires workspace API keys, POST plan gates, provider media rules, and explicit live-write confirmation."
---

# CORE POST Agent Kit

Use this skill when an agent or automation needs to prepare POST content, validate provider rules, run dry tests, or publish through Devad CORE.

Current API authority:

```text
https://devad.io/api/v1/post
```

Do not use the old public StackPosts-style API as the implementation authority:

```text
https://post.devad.io/api/public/v1
```

That legacy API and its old payload examples are reference material only.

## Non-Negotiable Rules

1. Laravel CORE `/api/v1/post/*` is the only write authority.
2. Use workspace API keys only: `Authorization: Bearer wsk_...`.
3. Read API keys from environment variables such as `DEVAD_POST_API_KEY`, `DEVAD_POST_TOKEN`, or `DEVAD_WORKSPACE_API_KEY`.
4. Never pass tokens as CLI args, MCP args, query strings, screenshots, logs, or docs.
5. Dry-run is the default for CLI, scripts, MCP, n8n, and Sheets.
6. Live writes require `DEVAD_POST_ALLOW_WRITES=1`, explicit confirmation, API key scope, POST plan entitlement, idempotency, quota, and provider-rule checks.
7. Agent Kit create-post paths are validation-gated: CLI `posts:create` and MCP `post_posts_create` run provider media-rule preflight before writes.
8. For live retries, pass stable idempotency keys: scripts and CLI use `--idempotency-key`, MCP uses `idempotency_key` / `idempotencyKey`, and n8n/Sheets use row-based keys.
9. Treat CORE `block_states` and Agent Kit `validation.provider_results` as source-of-truth structured output. Do not parse human messages when structured states exist.
10. Do not claim a provider `PASS` unless CORE succeeds and the external provider page/permalink shows the exact unique marker.
11. External model or agent advice is not proof; verify it against CORE source, tests, and official provider docs.

## Provider-First Thinking Rule

For every request, validate in this order:

1. Identify selected provider, channel, and variant.
2. Check the provider capability allowlist.
3. Check media MIME, count, ratio, size, and duration for that exact variant.
4. Build only the provider-specific payload documented by the official API and implemented in CORE.
5. Reject unsupported combinations early with a clear blocking reason.
6. Never coerce unknown media into `image_url` or `video_url`.

Bad examples to reject:

- PDF to Instagram `image_url`.
- Image to Instagram Reel or Facebook Reel video path.
- First comment on Instagram Story unless the official API path is proven and implemented.
- LinkedIn PDF through image/video paths; documents require a dedicated Documents API slice.
- YouTube image/PDF post; CORE YouTube publishing is video upload only.

## Current Provider Baseline

| Provider | Current stance |
|---|---|
| Tumblr Blog | Text, link, photo, video; fresh external proof still required. |
| LinkedIn Page | Text and single image only; profile delayed; video, carousel, and document are future slices. |
| Telegram Channel/Group | Text, photo, video, document; manual token plus verification-text flow. |
| Facebook Page | Feed text/link, image feed, video feed, reel, story image/video, first comment where supported. |
| Instagram Business | Image feed, video/reel shared to feed, story image/video; story comments and carousel remain unsupported until proven. |
| YouTube Channel | Video upload only. |
| Pinterest Board | Image Pin; fresh proof needs a unique marker. |
| Google Business Profile | STANDARD local post only until event/offer support is proven in CORE. |
| TikTok Profile | Sandbox/private video partial; public PASS waits for app approval or reviewer-visible public posting. |
| X, Reddit, OK, Threads, Instagram Unofficial | Code-only unless owner explicitly re-approves live testing. |

## Recommended Agent Workflow

1. Load account/channel choices from CORE with a dry-run or accounts call.
2. Normalize the user row or payload into native CORE shape.
3. Validate provider/channel/variant and media rules before building payload.
4. If the CORE Agent Kit is available, run CLI `validate` or MCP `post_dry_run_validate`; create-post also runs the same preflight gate.
5. Run dry-run first and inspect `warnings`, `blocking_reasons`, `block_states`, and `validation.provider_results`.
6. For live writes, require:
   - `DEVAD_POST_ALLOW_WRITES=1`
   - explicit `--live --confirm` or MCP `confirm: true`
   - a scoped `wsk_...` key from environment
   - a unique marker in the post text
7. After publish, wait the provider-appropriate interval and verify the exact marker externally.

## Environment

Use these environment variables:

```bash
DEVAD_POST_API_BASE=https://devad.io/api/v1/post
DEVAD_POST_API_KEY=wsk_xxx
DEVAD_POST_ALLOW_WRITES=0
DEVAD_POST_IDEMPOTENCY_KEY=manual-run-001
```

Compatibility aliases may be accepted by local scripts:

```bash
DEVAD_POST_TOKEN
DEVAD_WORKSPACE_API_KEY
POST_API_BASE
POST_API_TOKEN
```

The aliases are for migration convenience only. New docs and automation should prefer the `DEVAD_POST_*` names.

## Scripts

Node:

```bash
node scripts/test_runner.js list-tests
node scripts/test_runner.js facebook_image --print-payload
node scripts/test_runner.js facebook_image --live --confirm --idempotency-key row-42-facebook-image
```

Python:

```bash
python scripts/test_runner.py list-tests
python scripts/test_runner.py facebook_image --print-payload
python scripts/test_runner.py facebook_image --live --confirm --idempotency-key row-42-facebook-image
```

Without `--live --confirm`, scripts are dry-run only and do not call the POST API. Live script writes also require `--idempotency-key` or `DEVAD_POST_IDEMPOTENCY_KEY`.

## Google Sheets And n8n

The Sheets and n8n examples are automation clients, not provider authorities.

They must:

- call CORE `/api/v1/post/*`
- use env/config-stored `wsk_...` keys, never query tokens
- process one row or one small batch at a time by default
- send stable idempotency/correlation IDs
- preserve `block_states`, warnings, blocking reasons, and Agent Kit `validation.provider_results`
- avoid live writes unless the user explicitly enables live mode

## Legacy Reference Boundary

The old `post.devad.io` payload shape, Google Sheet `PostService.gs`, and n8n workflow are useful compatibility references. They should be normalized into CORE requests and tested through dry-runs. They must not reintroduce:

- `X-Api-Token` auth
- `?api_token=` query auth
- live publishing by default
- direct provider API calls from scripts, n8n, Sheets, or MCP
- unsupported provider/media claims

## Proof Standard

A provider/type is not complete until there is evidence for:

1. deployed CORE SHA and health check,
2. dry-run/API/provider-rule validation,
3. live CORE publish success when approved,
4. external provider visibility with the exact unique marker.

Anything less is `PARTIAL`, `API_NOT_SUPPORTED`, `WAITING_PROVIDER_OR_OWNER_GATE`, or `BLOCKED_WITH_EVIDENCE`, not `PASS`.
