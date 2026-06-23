# Handoff: Devad.io/POST Repo Text And Template Migration

Date: 2026-06-23
Repo: `devadio/post-skill`
Local checkout: `D:\CDX-3\core-aio\post-skill`

## Completed

- Replaced retired POST subdomain branding with `Devad.io/POST` across markdown, Apps Script, n8n template files, and payload guidance.
- Updated public links to current Devad paths:
  - API base: `https://devad.io/api/v1/post`
  - POST app/API-key panel: `https://devad.io/workspaces/apps/post/agent`
  - Public POST landing path: `https://devad.io/post`
- Migrated Google Sheet Apps Script references from query-token style to CORE bearer workspace API key wording.
- Updated `PostService.gs` to call:
  - `POST https://devad.io/api/v1/post/media`
  - `POST https://devad.io/api/v1/post/posts`
  - `Authorization: Bearer wsk_...`
- Updated Apps Script publish payloads to use `media_ids` returned from CORE `/media`.
- Updated n8n SDK and exported workflow JSON to use:
  - `devad_post_api_key`
  - bearer headers
  - `/media` upload
  - `media_ids` in post payloads
- Updated video payload fixture instructions from retired upload wording to CORE `/media` and `media_ids`.

## Verification Run

- Parsed `n8n-automation/codex-post-sheet-to-social-full.workflow.json` with `JSON.parse`.
- Parsed `n8n-automation/codex-post-sheet-to-social-full.sdk.js` with `node --check`.
- Parsed all `google-sheet/apps-script/*.gs` files through Node `vm.Script`.
- Ran `git diff --check`.
- Searched repo for the retired host string; no matches remain outside `.git`.

## Known Notes

- `api_token` and `X-Api-Token` still appear only in guardrail docs that say not to use or reintroduce them.
- Apps Script still keeps a read fallback for the older `POST_API_TOKEN` ScriptProperties key, but saves new values as `DEVAD_POST_API_KEY`.
- No live Google Sheet deployment, n8n import, provider post, or CORE deploy was performed in this cleanup.

## Next Safest Task

Open a fresh chat to validate the updated repo branch/PR only:

1. Confirm the GitHub branch and PR from this handoff.
2. Review the Apps Script diff for live sheet compatibility.
3. If approved, deploy/push the Apps Script project with `clasp` or the repo workflow.
4. Reimport the n8n workflow in a sandbox n8n instance and run a dry test only.
5. Do not create live social posts until the user explicitly approves a new proof run.
