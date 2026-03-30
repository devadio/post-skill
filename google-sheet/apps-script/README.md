# POST.devad.io Google Sheets Apps Script Bundle

This bundle does the heavy lifting: it reads the Sheet, detects media, builds per-platform payloads, uploads files, and writes results back to the log. That leaves the AI agent free to focus on generating the content and media instead of rebuilding the posting engine.

It also includes a lightweight Apps Script Web App API pattern for AI agents that need to read rows as JSON and update only the working cells in the `post` tab without a full Google Cloud Console setup.

This folder contains the Apps Script project files used by the Google Sheet automation workflow. It is intended to be copied into a Google Sheets bound Apps Script project, or used as a reference when building the same automation in another stack.

## What This Bundle Is

The script turns a Google Sheet into a publishing queue.

At a high level it does this:

1. Reads the next queued row from the `post` tab.
2. Detects the media type and prepares the right payload.
3. Uploads media when required.
4. Sends the post request to POST.devad.io.
5. Writes the result back into the sheet log and action columns.

## Files In This Folder

- `appsscript.json` - manifest and scopes
- `ConfigService.gs` - saved settings and platform configuration
- `DriveService.gs` - Google Drive file and folder handling
- `PostService.gs` - upload and publish API calls
- `SheetUI.gs` - sheet trigger, queue, logging, and UI logic
- `WebAppApi.gs` - lightweight JSON API for AI agents
- `SettingsSidebar.html` - publication manager sidebar
- `HelpDialog.html` - quick help dialog
- `USAGE_GUIDE.md` - beginner-friendly usage guide
- `package.json` and `package-lock.json` - local clasp/dev helper files

## AI Agent Web App Feature

This feature turns the same Google Sheet into a small JSON API.

Why this matters:

- the AI agent can read the sheet with a simple `GET`
- the AI agent can update only approved columns with a token-protected `POST`
- no separate Google Cloud Console API project is required for this pattern
- it is easy to deploy and easy for lightweight agents to understand

The current example is designed for:

- open read access
- token-protected write access
- reads and writes limited to the `post` tab only
- edits limited to non-header cells inside range `A:I`
- row 1 headers protected from edits

Example behavior:

- `GET <WEB_APP_URL>?sheet=post` returns the working rows as JSON with `__rowNumber`
- `POST <WEB_APP_URL>` with `token`, `rowNumber`, `column`, `value`, and optional `sheet` updates one allowed cell

### Deploy And Test This Web App Feature

1. Push the Apps Script files to the bound script project.
2. Deploy the script as a Web App with anonymous access if your Google account or workspace policy allows it.
3. Test the endpoint with:
   - `GET` to read all rows
   - `POST` with the token to update only non-header cells in `post!A:I`

Example test URLs and payload shape:

- `GET <WEB_APP_URL>?sheet=post`
- `POST <WEB_APP_URL>` with JSON:

```json
{
  "token": "your-custom-secure-token-123",
  "sheet": "post",
  "rowNumber": 3,
  "column": "log",
  "value": "Updated by API"
}
```

If Google still blocks anonymous access on a specific account or workspace, the code is still valid. In that case, finish the deployment from the Apps Script editor and use the generated Web App URL there.

## How To Add This To A Google Sheet

### Option 1: Copy Into An Existing Bound Project

1. Open the target Google Sheet.
2. Go to `Extensions` -> `Apps Script`.
3. Replace the script project files with the files from this folder.
4. Save the project.
5. Reload the Google Sheet.
6. Open `POST.devad.io` -> `Publication Manager`.
7. Paste your API token and Integration IDs.
8. Choose your automation frequency.
9. Click `SAVE & RUN SYNC`.

### Option 2: Use `clasp`

1. Install `clasp` if you do not already have it.
2. Log in once with your Google account.
3. Clone the bound project or create a new one.
4. Push these files into the Apps Script project.

Example:

```bash
npm install -g @google/clasp
clasp login
clasp clone <SCRIPT_ID>
clasp push -f
```

## Sheet Layout Expected By The Script

The current sheet logic expects a tab named `post` and these working columns:

- `A` Reference
- `B` Promotional link
- `C` Title
- `D` Social media summary (caption)
- `E` Creative link
- `F` Creative type
- `G` Action?
- `H` Check
- `I` log

The script is written to work with rows that are queued as `Not yet` or `To do`.

## Column Permissions For AI Agents

The web-app API reads all working columns in `post!A:I`, but the safest editing guidance is:

- `A Reference`: usually editable if your workflow uses an external ID or reference
- `B Promotional link`: editable
- `C Title`: editable
- `D Social media summary (caption)`: editable
- `E Creative link`: editable
- `F Creative type`: editable, but should use your supported values such as `image_manual`, `video_manual`, or `carousel_manual`
- `G Action?`: editable, used to queue or mark work
- `H Check`: read-only in normal use; better treated as an operations/helper field
- `I log`: usually read-only for humans because the script writes status here, but the API technically allows updates inside `A:I`

Important safety rule:

- row 1 headers are read-only and cannot be edited through the web-app API

## Recommended Content Rules From Real Testing

These rules come from the issues we actually hit while building and testing this workflow.

### General Rules

- Keep the tab name exactly `post`
- Do not rename the headers in row 1
- Do not move the working columns unless you also update the Apps Script
- Prefer clean public URLs
- Avoid links protected by firewall, anti-bot pages, login walls, or short-lived signed URLs
- Google Drive links work best when the file or folder is shared as viewable by anyone with the link

### Column-By-Column Guidance

- `A Reference`
  - Best use: your internal ID, content ID, or campaign reference
  - Recommended: short stable text
  - Good example: `POST-2026-041`

- `B Promotional link`
  - Best use: landing page, article, product page, or CTA URL
  - Recommended: full `https://` URL
  - This can be appended to captions on channels where `+ LINK` is enabled

- `C Title`
  - Best use: short content title or headline
  - Recommended length: `75-110 characters`
  - Keep it clear and readable
  - Avoid stuffing hashtags here
  - Good for YouTube title, Pinterest title, or internal organization

- `D Social media summary (caption)`
  - Best use: the actual post caption/body
  - Recommended length for this sheet workflow: maximum `1,000 characters`
  - Shorter is usually safer and performs better across platforms
  - Put the main message first
  - Keep heavy hashtag blocks limited
  - If using a promo link in caption, the script can append it per channel

- `E Creative link`
  - Best use: direct media URL or Google Drive link
  - This is one of the most important columns to get right

- `F Creative type`
  - Use the supported values only:
  - `image_manual`
  - `video_manual`
  - `carousel_manual`

- `G Action?`
  - Use this to control queue state
  - Safe values:
  - `To do`
  - `🟢 Done`
  - `🔴 Bug`
  - The script also still recognizes old `Not yet` rows for compatibility

- `H Check`
  - Best treated as helper/read-only unless you have a specific internal workflow

- `I log`
  - Best treated as output/read-only
  - The script writes success, skip, and failure details here

### Creative Link Rules By Media Type

- `image_manual`
  - Best input: one direct image URL
  - Best formats: `jpg`, `jpeg`, `png`, `webp`
  - Preferred source: Google Drive file link with public view access, or a direct CDN/media URL
  - Avoid pages that look like image URLs but actually return HTML
  - Avoid websites with anti-bot protection or blocked hotlinking

- `video_manual`
  - Best input: one direct video URL
  - Best format: `mp4`
  - Preferred source: stable public HTTPS URL or a Google Drive file link with public view access
  - Do not use playlist pages, preview pages, or expiring video URLs

- `carousel_manual`
  - Best input: a Google Drive folder link
  - Put only the intended carousel files inside that folder
  - Best formats inside the folder: `jpg`, `jpeg`, `png`, `webp`
  - Keep the folder shared as viewable by anyone with the link
  - Avoid mixing unsupported files, documents, shortcuts, or nested folders inside the carousel folder
  - Based on our testing, treating carousel as a Drive folder is the safest workflow

### Google Drive Sharing Rules

- For single image or video:
  - use a Google Drive file link
  - make sure it is viewable by anyone with the link

- For carousel:
  - use a Google Drive folder link
  - make sure the folder is viewable by anyone with the link
  - make sure the files inside are valid image files

If Drive access is wrong, the script can fail before publish even when the sheet row looks correct.

### Practical Advice For AI Agents

- Write only the working row fields, not the headers
- Prefer one clean media URL over clever URL transformations
- For carousel, create or use a dedicated Drive folder per post
- Keep captions concise
- Keep titles tighter than a blog headline
- When unsure, test first with one `image_manual` row before trying `video_manual` or `carousel_manual`

## Why This Code Is Useful As A Reference

This bundle is not just for Google Sheets.
It is also a clean example of how an AI agent or developer can build the same workflow in another environment.

An agent can study this folder to see:

- how row-based queueing works
- how platform-specific payloads are built from one row of data
- how media type changes the publish rules
- how to skip unsupported platforms without breaking the whole batch
- how success and failure are written back into the sheet
- how a lightweight UI can manage automation settings

The same ideas can be adapted to:

- Apps Script
- Node.js
- Python
- PHP
- n8n
- custom internal tools

## Recommended Use

If you are adding this to a sheet for the first time:

1. Read `../README.md` first.
2. Read `USAGE_GUIDE.md` for the row format and beginner steps.
3. Copy the files into the bound Apps Script project.
4. Set up the `POST.devad.io` menu.
5. Test one image row before using carousel or video rows.

## Notes For Developers

- Keep the `post` tab name unchanged unless you also update the script.
- Keep the status cell logic in sync with the dropdown values in the sheet.
- If you change column positions, update the row mapping in `SheetUI.gs` and the sidebar text together.
- If you want to port this to another language, treat the payload builder and row workflow as the core design, not the Apps Script syntax.

## Helpful Links

- [Google Sheet Guide](../README.md)
- [AI Agent Skill](https://github.com/devadio/post-skill)
- [Latest Copy of the Sheet](https://docs.google.com/spreadsheets/d/1oyiLNgJnEFzdpQBjnNcbbArseX_FZvjrdjH24mnGuME/copy)
- [Support](https://devad.io/contact-us/)
