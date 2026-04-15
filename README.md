# Post-Skill

Post-Skill is an open reference bundle for building social publishing flows around POST.devad.io. It is designed for both human operators and AI agents.

## What this repo gives you

- A Google Sheets + Apps Script workflow for row-based publishing
- A working n8n automation template for the same POST.devad.io flow
- Example payloads for common post types
- AI-agent-facing docs that explain the expected payload shape and workflow rules

## Main areas

- `SKILL.md`
  - Technical reference for AI agents and developers
- `MASTER_PROMPT.md`
  - Short onboarding prompt for assistants
- `payloads/`
  - Example payloads for platforms and post types
- `scripts/`
  - Local test runners
- `google-sheet/`
  - Google Sheets publishing workflow docs
- `google-sheet/apps-script/`
  - Full Apps Script bundle mirrored from the working sheet project
- `n8n-automation/`
  - Sanitized n8n workflow template and setup guide

## Google Sheet workflow

The Google Sheet workflow is the easiest way to manage content for both humans and agents:

- one row per planned post
- media links stored directly in the sheet
- action status written back into the same row
- support for link-in-caption, first comment, and optional FB/IG story duplicates

Start here:

- [Google Sheet guide](google-sheet/README.md)
- [Apps Script bundle](google-sheet/apps-script/README.md)

## n8n workflow template

The repo now includes the working n8n template used for:

- reading queued rows from the `post` tab
- resolving direct links, Google Drive files, and Google Drive folders
- detecting `text`, `image`, `video`, and `carousel`
- sending feed posts to POST.devad.io
- optionally sending a separate FB/IG story request
- writing `Action?` and `log` back into the same sheet row

Start here:

- [n8n template guide](n8n-automation/README.md)
- [Sanitized workflow source](n8n-automation/codex-post-sheet-to-social-full.sdk.js)

### n8n benefits

- lower maintenance than building one branch per platform
- one shared setup node for token, IDs, and defaults
- one-row-per-run safety by default
- easy to adapt for webhook fan-out or queue-based automation

## Supported content types

- `text`
- `image`
- `video`
- `carousel`
- optional FB/IG first comment behavior
- optional FB/IG story duplicate behavior

## Supported channels in the current reference flow

- TikTok
- Instagram
- Facebook
- LinkedIn
- YouTube
- Pinterest
- Telegram
- Tumblr
- Google Business Profile

Channel behavior still depends on the account type, media type, and the capabilities available in your POST.devad.io integrations.

## Recommended order for new users

1. Read the Google Sheet guide if you want the sheet-first workflow.
2. Read the n8n guide if you want the automation-first workflow.
3. Add your POST.devad.io token and integration IDs.
4. Test one Telegram or single-image row first.
5. Only then enable optional story or webhook branches.

## Notes about private values

This repo is intended to be public-safe:

- no private API tokens should be committed
- no personal integration IDs should be committed
- no private Google credentials should be committed

Use placeholder values in public templates and fill real values only inside your own live environment.

## Support

- [POST.devad.io](https://post.devad.io)
- [Docs and guides](https://devad.io/guides/topics/post-devad-io-docs/)
