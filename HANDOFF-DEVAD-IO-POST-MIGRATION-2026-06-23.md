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
- Added `google-sheet/apps-script/.clasp.json` for the live working Apps Script project:
  - Script project: `1yZJ5OYb_ZjX5AfUhGhwjz1nPTHQUqSce5CxFWSM03hgKrT_L34tikByU`
  - Bound sheet: `https://docs.google.com/spreadsheets/d/1oyiLNgJnEFzdpQBjnNcbbArseX_FZvjrdjH24mnGuME/edit`
- Pushed the migrated Apps Script source to the live Google Apps Script project with `npx clasp push -f`.

## Verification Run

- Parsed `n8n-automation/codex-post-sheet-to-social-full.workflow.json` with `JSON.parse`.
- Parsed `n8n-automation/codex-post-sheet-to-social-full.sdk.js` with `node --check`.
- Parsed all `google-sheet/apps-script/*.gs` files through Node `vm.Script`.
- Ran `git diff --check`.
- Searched repo for the retired host string; no matches remain outside `.git`.
- Pulled the live Apps Script project back with `npx clasp pull` after the push and searched `google-sheet/apps-script`; no retired host string matches remain.
- Refreshed the live Google Sheet in Chrome, reopened `Devad.io/POST` -> `Publication Manager`, and verified the visible sidebar shows `Devad.io/POST`, `Generate your workspace API key and account IDs at:`, and `Paste workspace API key here...`; no visible retired host string remained.

## Known Notes

- `api_token` and `X-Api-Token` still appear only in guardrail docs that say not to use or reintroduce them.
- Apps Script still keeps a read fallback for the older `POST_API_TOKEN` ScriptProperties key, but saves new values as `DEVAD_POST_API_KEY`.
- Live Apps Script source was pushed to the bound Google project. No n8n import, provider post, or CORE deploy was performed in this cleanup.

## Next Safest Task

Open a fresh chat to validate the updated repo branch/PR only:

1. Confirm the GitHub branch and PR from this handoff.
2. Review the Apps Script diff for live sheet compatibility.
3. Reimport the n8n workflow in a sandbox n8n instance and run a dry test only.
4. Do not create live social posts until the user explicitly approves a new proof run.
