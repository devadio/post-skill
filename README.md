# Post-Skill

Post-Skill is a public-safe reference bundle for building social publishing automation around the native Devad CORE POST API.

Current API authority:

```text
https://devad.io/api/v1/post
```

The old `post.devad.io/api/public/v1` flow is legacy reference material only. New agents and automations should use CORE workspace API keys, dry-run first, and provider-specific media rules.

## What This Repo Gives You

- AI-agent-facing instructions in `SKILL.md`
- a short paste-ready prompt in `MASTER_PROMPT.md`
- local Node and Python test runners
- example payload fixtures
- Google Sheets and n8n reference workflows
- migration guidance for old POST.devad.io row/payload shapes
- CORE template preflight drift guidance for Sheet/n8n provider-rule sync

## Safety Model

| Rule | Meaning |
|---|---|
| Native CORE API only | Clients call `/api/v1/post/*`; they do not write database rows or provider APIs directly. |
| Bearer `wsk_...` only | Use `Authorization: Bearer wsk_...`; do not use query-token auth or `X-Api-Token`. |
| Env-only secrets | API keys live in environment or private tool config, never in prompts, payload files, screenshots, or git. |
| Dry-run default | Scripts, Sheets, n8n, and MCP-style agent calls should validate first and write only after explicit confirmation. |
| Server-side limits win | POST plans, scopes, quota, idempotency, rate limits, and provider media rules are enforced by CORE. |
| External proof required | A provider/type is not a PASS until the exact unique marker is visible on the provider page/permalink. |

## Environment

Preferred:

```bash
DEVAD_POST_API_BASE=https://devad.io/api/v1/post
DEVAD_POST_API_KEY=wsk_xxx
DEVAD_POST_ALLOW_WRITES=0
DEVAD_POST_IDEMPOTENCY_KEY=manual-run-001
```

Compatibility aliases may work in local scripts:

```bash
DEVAD_POST_TOKEN
DEVAD_WORKSPACE_API_KEY
POST_API_BASE
POST_API_TOKEN
```

## Scripts

Node:

```bash
node scripts/test_runner.js list-tests
node scripts/test_runner.js facebook_image --print-payload
node scripts/test_runner.js facebook_image --live --confirm --idempotency-key row-42-facebook-image
node scripts/test_runner.js upload ./image.jpg --live --confirm --idempotency-key row-42-media-0
```

Python:

```bash
python scripts/test_runner.py list-tests
python scripts/test_runner.py facebook_image --print-payload
python scripts/test_runner.py facebook_image --live --confirm --idempotency-key row-42-facebook-image
python scripts/test_runner.py upload ./image.jpg --live --confirm --idempotency-key row-42-media-0
```

Without `--live --confirm` plus `DEVAD_POST_ALLOW_WRITES=1`, scripts stay in dry-run mode. Live writes also require `--idempotency-key` or `DEVAD_POST_IDEMPOTENCY_KEY` so retries do not double-post.

When the CORE Agent Kit package is available, run one of these before live writes:

```bash
devad-post provider-rules --provider facebook_page
devad-post provider-rules:compare --file saved-automation-response.json
devad-post provider-proof:packet --provider pinterest_board
devad-post provider-matrix --provider youtube_channel
devad-post validate --input payload.json
devad-post posts:create --dry-run --input payload.json
```

Use `provider-rules` to inspect the current local provider variant/media matrix before constructing Sheet, n8n, or agent payloads.
Use `provider-rules:compare` to compare local Agent Kit rules with a saved or live CORE `/automation` `provider_rules` contract before assuming local and deployed rules match. Record `summary.mismatches: 0` and `fingerprints.match: true` as the compact proof; do not paste full provider-rule payloads into docs or logs.
Use `provider-proof:packet` before a provider chunk to build a secret-safe variant/media/acceptance-gate packet from local CORE rules.
Use `provider-matrix` to dry-sweep implemented and intentionally unsupported variants and catch fixture-vs-validator mismatches before provider-specific chunks.

MCP agents should call `post_dry_run_validate` before `post_posts_create`. The current Agent Kit also runs validation inside `posts:create` / `post_posts_create`: a `BLOCKED` provider media-rule result returns structured `ok:false` output and stops before writes; warning-only payloads continue with validation evidence.
MCP agents can call `post_provider_rules_get` first to inspect supported variants without API keys, live-write permission, or provider calls.
MCP agents can call `post_provider_rules_compare` with a `provider_rules` object to detect local/live contract drift without provider calls.
MCP agents can call `post_provider_proof_packet_build` to prepare a provider chunk packet without API keys, provider calls, or credential reads.
MCP agents can call `post_provider_matrix_run` for a deterministic provider media matrix without API keys, live-write permission, or provider calls.

For exact media checks, pass `settings.mime_type` plus available metadata (`duration_seconds`, `width`, `height`, `frame_rate`, `size_bytes`) into `validate` / `post_dry_run_validate`. The Agent Kit should block provider-specific MIME/spec issues early, such as Telegram `.mov` through `sendVideo`, TikTok over-duration video, or `first_comment` on Story variants.

## Main Areas

- `SKILL.md`: technical operating rules for AI agents and developers.
- `MASTER_PROMPT.md`: concise prompt to give another assistant.
- `payloads/`: provider examples and blocked/legacy fixtures.
- `scripts/`: local dry-run/live-gated runners.
- `google-sheet/`: Google Sheets publishing workflow reference.
- `google-sheet/apps-script/`: Apps Script bundle from the old sheet workflow.
- `n8n-automation/`: n8n workflow reference for row-based automation.
- `PROVIDER_MATRIX.md`: CORE Agent Kit provider matrix command/tool contract.
- `TEMPLATE_PREFLIGHT_DRIFT.md`: CORE command to keep Sheet/n8n embedded preflight maps aligned with Agent Kit provider rules.

## Provider Baseline

Always validate provider, channel, and variant before media:

- Facebook Page: feed text/link, image feed, video feed, reel, story image/video, first comment where supported.
- Instagram Business: image feed, video/reel shared to feed, story image/video; story comments and carousel require explicit CORE proof.
- LinkedIn Page: text and single image only until video/carousel/document slices are implemented and proven.
- Telegram channel/group: text, photo, video, document.
- YouTube Channel: video upload only.
- Pinterest Board: image Pin unless current CORE/API support proves more.
- Google Business Profile: STANDARD local post only unless event/offer support is proven.
- TikTok: fail closed unless creator-info, privacy, commercial disclosure, AIGC, and app-approval gates pass.
- X, Reddit, OK, Threads, Instagram Unofficial: code-only unless live testing is explicitly re-approved.

## Google Sheet And n8n Notes

The included Sheet and n8n flows are useful for planning and automation, but they are not provider authorities.

They should be adapted to:

- call CORE `/api/v1/post/*`
- send stable idempotency/correlation IDs
- process one row or one small batch by default
- preserve warnings, blocking reasons, and `block_states`
- preserve Agent Kit `validation.provider_results` when available
- avoid live writes unless explicitly enabled

When editing CORE monorepo Sheet/n8n template preflight maps or provider-rule fixtures, run the drift gate from [TEMPLATE_PREFLIGHT_DRIFT.md](TEMPLATE_PREFLIGHT_DRIFT.md).

## Private Values

This repo must remain public-safe:

- no real API keys
- no cookies or OAuth codes
- no personal integration IDs
- no raw provider logs
- no private Google credentials

Use placeholder values in public files and fill real values only in your private environment.

## Support

- App: [devad.io](https://devad.io)
- POST app path: `https://devad.io/workspaces/apps/post`
- Docs and guides: [Devad POST docs](https://devad.io/guides/topics/post-devad-io-docs/)
