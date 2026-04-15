# n8n Automation Template

This folder contains the working n8n template for `CODEX - POST.devad.io - Sheet To Social Full`, stripped of private tokens, IDs, and personal sheet values.

## Why use this template

- Reads queued rows directly from a Google Sheet
- Resolves media from direct links, Google Drive files, and Google Drive folders
- Uploads resolved media to POST.devad.io first, then uses the returned media URLs for publishing
- Detects `text`, `image`, `video`, and `carousel`
- Sends one POST.devad.io feed request per selected row
- Optionally sends a second FB/IG story request when story mode is enabled
- Writes status back to the sheet so human users and AI agents see the result
- Supports an optional webhook branch for downstream automations

## Files in this folder

- `codex-post-sheet-to-social-full.sdk.js`
  - Sanitized n8n Workflow SDK source
  - Safe to commit publicly
  - Replace placeholders before first run
- `README.md`
  - Setup guide and node-by-node explanation

## First-time setup

1. Copy or recreate the workflow in n8n using `codex-post-sheet-to-social-full.sdk.js`.
2. Relink the Google Sheets credential in `Read Post Sheet` and `Update Sheet Status`.
3. Relink the Google Drive credential in `List Drive Folder Files`.
4. Open the node named `add-HERE-your-token-and-ids`.
5. Replace all placeholder values with your own POST.devad.io token, integration IDs, sheet URL, and any optional defaults.
6. Run the workflow with one test row first.

## What to edit in `add-HERE-your-token-and-ids`

This is the main setup node. Most users only need to edit this node and relink Google credentials.

| Field | Required | What it does |
| --- | --- | --- |
| `base_url` | Yes | Base API URL for your POST.devad.io public API. Keep the default unless your API lives on another domain. |
| `spreadsheet_url` | Yes | Full Google Sheet URL that contains the `post` tab. |
| `sheet_name` | Yes | Sheet tab name to read from and write back to. Default is `post`. |
| `post_devad_io_token` | Yes | Your POST.devad.io public API token. |
| `instagram_id` | Optional | POST.devad.io integration ID for Instagram. Leave empty if you do not use Instagram. |
| `youtube_id` | Optional | POST.devad.io integration ID for YouTube. |
| `tiktok_id` | Optional | POST.devad.io integration ID for TikTok. |
| `facebook_id` | Optional | POST.devad.io integration ID for Facebook Page posting. |
| `pinterest_id` | Optional | POST.devad.io integration ID for Pinterest. |
| `pinterest_board_id` | Optional | Board ID used when sending Pinterest posts. |
| `telegram_id` | Optional | POST.devad.io integration ID for Telegram. |
| `linkedin_page_id` | Optional | POST.devad.io integration ID for LinkedIn pages. |
| `linkedin_profile_id` | Optional | POST.devad.io integration ID for LinkedIn profiles. |
| `tumblr_id` | Optional | POST.devad.io integration ID for Tumblr. |
| `google_business_profile_id` | Optional | POST.devad.io integration ID for Google Business Profile. |
| `default_promo_link_mode` | Optional | Default treatment for the promo link column. Typical values: `caption` or `comment`. |
| `facebook_promo_link_mode` | Optional | Override for Facebook. Use `comment` if you want the promo link as first comment. |
| `instagram_promo_link_mode` | Optional | Override for Instagram. Use `comment` if you want the promo link as first comment. |
| `facebook_plus_story` | Optional | `1` sends an extra Facebook Story request in addition to the feed post. `0` disables it. |
| `instagram_plus_story` | Optional | `1` sends an extra Instagram Story request in addition to the feed/reel post. `0` disables it. |
| `process_row_numbers` | Optional | Comma-separated row numbers if you want to force specific rows only. Leave empty for normal queue mode. |
| `max_rows_per_run` | Optional | Maximum actionable rows to process per run. Default is `1` to avoid sweeping the whole sheet by mistake. |
| `default_webhook_url` | Optional | Optional fallback webhook endpoint for rows that should also notify another system. |
| `default_webhook_method` | Optional | HTTP method for the optional webhook branch. Usually `POST`. |

## What each workflow node does

### Setup and credentials

- `Manual Trigger`
  - Starts a manual test run.
  - No user edits needed.
- `add-HERE-your-token-and-ids`
  - Main setup node.
  - Replace placeholders here.
- `Fetch PostApi Accounts`
  - Calls `/accounts` to confirm the token and resolve current integrations.
  - Usually no edits needed.
- `Read Post Sheet`
  - Reads the source tab from Google Sheets.
  - Relink Google Sheets credential if auth fails.

### Row selection and media routing

- `Normalize Action Rows`
  - Filters the sheet down to actionable rows such as `To do`, `post`, `publish`, or `queue`.
  - Normalizes sheet column names and detects whether the row uses text, direct media, a Drive file, or a Drive folder.
  - Only edit this if you intentionally change your sheet column names.
- `Current Row Batch`
  - Processes one row at a time.
  - This is deliberate. It prevents accidental bulk posting and keeps logs easier to read.
- `Route Media Source`
  - Sends each row to the correct media-prep path based on whether the source is a Drive folder, Drive file, or direct link.
- `List Drive Folder Files`
  - Reads files from a Google Drive folder when the row points to a folder.
  - Relink Google Drive credential if auth fails.
- `Build Media From Folder`
  - Converts the folder file list into ordered media URLs and infers `carousel`, `image`, or `video`.
- `Build Media From Drive File`
  - Converts one Drive file ID into a direct download URL.
- `Build Media From Direct Links`
  - Uses one or more direct media URLs already present in the row.
- `Upload Media To POST.devad.io`
  - Downloads each resolved media asset and uploads it to POST.devad.io `/upload`.
  - This matches the working Google Sheets Apps Script behavior.
  - It is especially important for video and carousel reliability.

### Payload building and optional fan-out

- `Build PostApi Payload`
  - Converts the row into the POST.devad.io request payload.
  - Handles channel-specific settings such as Pinterest board IDs, TikTok privacy fields, and FB/IG first-comment modes.
  - Usually no edits needed unless you add new channels or sheet columns.
- `Route Optional Webhook`
  - Decides whether to send a second webhook request.
  - No edits needed for normal POST.devad.io-only usage.
- `Send Optional Webhook`
  - Sends the optional external webhook if a row or default config provides a URL.
  - Ignore this node if you do not use webhook fan-out.

### POST.devad.io publishing

- `Post Feed To POST.devad.io`
  - Sends the main feed/reel/video/carousel request to POST.devad.io.
  - No edits needed beyond the token and IDs in the setup node.
- `Route Story Request`
  - Decides whether an extra FB or IG story request is needed.
  - Triggered only when `facebook_plus_story` or `instagram_plus_story` is enabled and the media type supports it.
- `Post Story To POST.devad.io`
  - Sends the separate story request to POST.devad.io.
  - This is intentionally separate from the feed request.
- `No Story Needed`
  - This node is intentionally almost empty.
  - It is the no-op branch used when the row should not create a story request.
  - It does not send anything anywhere. It just lets the workflow continue to the sheet update step with a clean branch.

### Logging and finish

- `Build Sheet Update Data`
  - Converts API results into the `Action?` and `log` values that should be written back into the sheet.
- `Update Sheet Status`
  - Writes the result back into the same row in Google Sheets.
  - Relink the Google Sheets credential here if needed.
- `Done`
  - This node does not send a message to Telegram, email, or any outside system.
  - It only outputs the internal text `Workflow finished processing current actionable rows.` so a manual run ends with a clear result in n8n.

## Why `No Story Needed` is almost empty

That is correct. It is intentionally a do-nothing branch. In a visual workflow, a no-op node is often the cleanest way to keep two branches symmetrical:

- branch A: send an extra story request
- branch B: skip the story request and continue

Without that branch, the workflow is harder to read and harder for beginners to trace.

## Recommended defaults for new users

- Keep `max_rows_per_run = 1`
- Leave `process_row_numbers` empty unless you are targeting specific rows
- Start with Telegram or one simple image-only channel first
- Turn `facebook_plus_story` and `instagram_plus_story` off until the basic feed workflow is confirmed

## Troubleshooting

- If `Read Post Sheet` or `Update Sheet Status` fails:
  - relink Google Sheets OAuth2
- If `List Drive Folder Files` fails:
  - relink Google Drive OAuth2
- If `Fetch PostApi Accounts` fails:
  - verify `base_url`
  - verify `post_devad_io_token`
- If rows are skipped:
  - confirm the `Action?` column contains `To do`, `post`, `queue`, or `publish`
- If nothing should send a story:
  - keep `facebook_plus_story = 0`
  - keep `instagram_plus_story = 0`

## Suggested user flow

1. Fill one test row in the `post` sheet.
2. Confirm the media link is stable and public.
3. Run the workflow manually.
4. Confirm the sheet writes back `Done` plus a useful log.
5. Only then increase `max_rows_per_run` or add optional webhook fan-out.
