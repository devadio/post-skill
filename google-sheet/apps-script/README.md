# POST.devad.io Google Sheets Apps Script Bundle

This bundle does the heavy lifting: it reads the Sheet, detects media, builds per-platform payloads, uploads files, and writes results back to the log. That leaves the AI agent free to focus on generating the content and media instead of rebuilding the posting engine.

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
- `SettingsSidebar.html` - publication manager sidebar
- `HelpDialog.html` - quick help dialog
- `USAGE_GUIDE.md` - beginner-friendly usage guide
- `package.json` and `package-lock.json` - local clasp/dev helper files

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

- `B` Promo link
- `C` Title
- `D` Caption
- `E` Media URL
- `F` Media Type
- `G` Action / status
- `I` Log

The script is written to work with rows that are queued as `Not yet` or `To do`.

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
