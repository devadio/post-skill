# n8n Automation Reference

This folder is a legacy n8n reference for the old POST.devad.io Sheet-to-social workflow.

Do not import the included workflow as current CORE live automation until it is migrated and retested.

## Current CORE Target

| Item | Required value |
|---|---|
| API base | `https://devad.io/api/v1/post` |
| Auth | `Authorization: Bearer wsk_...` |
| Secret storage | n8n credentials or private environment only |
| Default mode | dry-run / validate |
| Live writes | only with explicit user approval, `DEVAD_POST_ALLOW_WRITES=1`, and a `confirm` flag |
| Idempotency | stable row/campaign correlation id |
| Errors | preserve CORE `block_states`, warnings, and blocking reasons |

## Legacy Files

- `codex-post-sheet-to-social-full.workflow.json`
- `codex-post-sheet-to-social-full.sdk.js`

These files may still contain legacy public API fields such as old base URLs, token config names, query-token compatibility, and old node labels. Treat them as workflow-shape examples only.

## Migration Checklist

Before using this workflow with CORE:

1. Replace the base URL with `https://devad.io/api/v1/post`.
2. Remove query-token auth and any `X-Api-Token` header.
3. Use only `Authorization: Bearer wsk_...` from a private n8n credential.
4. Add a dry-run switch that is enabled by default.
5. Add a live-write gate requiring both `DEVAD_POST_ALLOW_WRITES=1` and an explicit confirmation field.
6. Send one row or one small batch per run by default.
7. Add an idempotency or correlation key derived from the sheet row id and campaign id.
8. Validate provider, channel, variant, media MIME/count/ratio/duration before building payload.
9. If you add embedded CORE preflight maps, keep them aligned with [../TEMPLATE_PREFLIGHT_DRIFT.md](../TEMPLATE_PREFLIGHT_DRIFT.md).
10. Preserve `block_states`, warnings, and blocking reasons in the Sheet log column.
11. Do not claim provider PASS from n8n success alone; verify the exact marker on the external provider URL.

## Provider Rule Reminder

Always identify provider + channel + variant first:

- YouTube is video-only.
- Pinterest is image Pin unless current CORE/API proof says more.
- LinkedIn Page is text/single-image only until future slices prove video, carousel, or document support.
- TikTok fails closed without creator-info, privacy, commercial disclosure, AIGC, and app approval gates.
- Disabled providers stay code-only unless explicitly re-approved.

## Safe Use Today

Use the workflow files to understand:

- row parsing,
- Google Drive media expansion,
- one-row automation shape,
- status/log writeback,
- story/comment branching concepts.

Do not use them for live CORE writes until the migration checklist above is complete and dry-run tests pass.
