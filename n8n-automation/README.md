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

- `codex-post-sheet-to-social-full.workflow.json`
  - Importable n8n workflow JSON for beginners
  - Generated from the sanitized SDK source
  - Contains no private API token, integration IDs, or bound credentials
- `codex-post-sheet-to-social-full.sdk.js`
  - Sanitized n8n Workflow SDK source for developers
  - Source-of-truth used to generate the JSON export
  - Safe to commit publicly
- `README.md`
  - Setup guide and node-by-node explanation

## First-time setup

1. Import `codex-post-sheet-to-social-full.workflow.json` into n8n.
2. Relink the Google Sheets credential in `Read Post Sheet` and `Update Sheet Status`.
3. Relink the Google Drive credential in `List Drive Folder Files`.
4. Open the node `Download Drive Media Asset`.
5. Set:
   - Authentication: `Predefined Credential Type`
   - Credential Type: `Google Drive OAuth2 API`
   - Credential: your real Google Drive credential
6. Save the workflow once from the n8n UI.
7. Open the node named `add-HERE-your-token-and-ids`.
8. Replace all placeholder values with your own POST.devad.io token, integration IDs, sheet URL, and any optional defaults.
9. Run the workflow with one test row first.

If you are maintaining or modifying the workflow logic itself:

- edit `codex-post-sheet-to-social-full.sdk.js`
- regenerate `codex-post-sheet-to-social-full.workflow.json`
- commit both files together

Why step 4-6 matters:

- this workflow downloads Google Drive files through an `HTTP Request` node so large Drive videos can use `acknowledgeAbuse=true`
- some n8n API/MCP workflow updates do not keep the HTTP Request node's Google Drive credential binding
- the manual UI save fixes that once

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
  - Converts one Drive file ID into a media item for the authenticated Drive download path.
- `Build Media From Direct Links`
  - Uses one or more direct media URLs already present in the row.
- `Route Upload Need`
  - Sends text-only rows directly to payload build.
  - Sends image, video, and carousel rows into the upload path.
- `Expand Media Upload Items`
  - Splits one row with multiple media URLs into one n8n item per media asset.
  - This is what makes carousel upload possible.
- `Download Media Asset`
  - Downloads each media asset into n8n binary data.
- `Download Drive Media Asset`
  - Downloads Drive files through the Google Drive API using `alt=media`, `acknowledgeAbuse=true`, and `supportsAllDrives=true`.
  - This is the node that must be manually bound to your Google Drive credential after import.
  - This node is the reason Google Drive videos can work in n8n instead of only in Apps Script.
- `Normalize Binary Metadata`
  - Ensures the downloaded binary has a usable filename extension and MIME type such as `.mp4` and `video/mp4`.
  - This avoids Laravel upload validation failures on Google Drive video files.
- `Upload Binary To POST.devad.io`
  - Uploads the downloaded binary file to POST.devad.io `/upload`.
  - This matches the working Google Sheets Apps Script behavior.
  - It is especially important for video and carousel reliability.
- `Collect Uploaded Media URLs`
  - Rebuilds the original row after all media files have been uploaded.
  - Produces the final uploaded media URL list used by the publish payload.

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
- If `Download Drive Media Asset` fails with `Credentials not found`:
  - open that node in the n8n UI
  - set `Predefined Credential Type`
  - choose `Google Drive OAuth2 API`
  - select your real Google Drive credential
  - save the workflow and rerun
- If Google Drive videos mark `Done` but do not really publish:
  - inspect `Download Drive Media Asset`
  - verify the binary is the real file, not a tiny preview artifact
  - inspect `Upload Binary To POST.devad.io`
  - verify `/upload` returns a real uploaded URL
- If `Fetch PostApi Accounts` fails:
  - verify `base_url`
  - verify `post_devad_io_token`
- If rows are skipped:
  - confirm the `Action?` column contains `To do`, `post`, `queue`, or `publish`
- If the sheet shows `#REF!` near your status columns:
  - remove broken formulas from the `Check` / `Action?` area
  - make sure the workflow can write plain values back into the target row
- If nothing should send a story:
  - keep `facebook_plus_story = 0`
  - keep `instagram_plus_story = 0`

## Suggested user flow

1. Fill one test row in the `post` sheet.
2. Confirm the media link is stable and public.
3. Run the workflow manually.
4. Confirm the sheet writes back `Done` plus a useful log.
5. Test one Google Drive video row.
6. Test one carousel row.
7. Only then increase `max_rows_per_run` or add optional webhook fan-out.
