# Google Sheet Automation

POST.devad.io handles the heavy lifting here: the sheet logic, Apps Script, and publication manager take care of queueing, uploads, platform rules, retries, and logging. The AI agent stays focused on writing the caption, choosing the media, and filling the right row.

This folder is the landing page for the Google Sheets workflow behind POST.devad.io, and it is also a clear reference for AI agents or developers who want to understand the workflow before customizing it elsewhere.

It now also covers the lightweight Apps Script Web App API pattern, which lets an AI agent read sheet rows as JSON and update only approved columns through a token-protected endpoint.

## What You Will Find Here

- `google-sheet/apps-script/` - the full Apps Script bundle mirrored from the live Sheet project
- `google-sheet/README.md` - this guide
- `google-sheet/apps-script/README.md` - setup and reference notes for the script bundle

That means this area now covers both:

- the publishing queue workflow
- the sheet-as-API workflow for lightweight agents

## Quick Start

1. Open the Google Sheet that you want to automate.
2. Open the Apps Script project tied to that Sheet, or create one if needed.
3. Copy the files from `google-sheet/apps-script/` into the bound Apps Script project.
4. Save your token and platform IDs in the `POST.devad.io` menu.
5. Use the `post` sheet tab to queue posts.
6. Run `SAVE & RUN SYNC` or enable automation.

If you only need the setup steps for the sheet itself, continue with the Apps Script README inside the same folder.

## How The Sheet Workflow Works

The sheet is row-driven:

- Column `B` stores the promo link
- Column `C` stores the title
- Column `D` stores the caption
- Column `E` stores the media URL
- Column `F` stores the media type
- Column `G` stores the action status
- Column `I` stores the log output

The script reads one queued row at a time, prepares the payload per platform, uploads the media when needed, and then writes the result back into the sheet.

### Best-Practice Input Rules

Based on our real testing, the safest row inputs are:

- `C Title`: keep it around `75-110 characters`
- `D Social media summary (caption)`: keep it under `1,000 characters`
- `E Creative link` for `image_manual`: use one direct public image link, ideally a Google Drive file with view access
- `E Creative link` for `video_manual`: use one stable public video link, ideally `mp4`
- `E Creative link` for `carousel_manual`: use a Google Drive folder link, not a single file
- Google Drive files and folders should be viewable by anyone with the link
- avoid firewall-protected, anti-bot, or login-only media links

If you want the detailed column rules and media guidance, see `google-sheet/apps-script/README.md`.

## Why This Folder Is Useful For AI Agents

This repository is not only a working Google Sheets setup. It is also a reusable blueprint.

An AI agent can use the code here to understand:

- how a spreadsheet becomes a publishing queue
- how media is detected and routed by type
- how each platform gets its own payload rules
- how to log success, skips, and failures back into the sheet
- how to translate the same automation into another environment

That means the same logic can be adapted to:

- Apps Script
- Node.js
- Python
- PHP
- n8n
- custom backend services

The important part is the workflow, not the language.

## Recommended Workflow

If you are setting this up for the first time:

1. Read `google-sheet/apps-script/README.md`.
2. Copy the Apps Script files into your Sheet project.
3. Open the `post` tab and verify the column layout.
4. Save your credentials in the manager.
5. Test with one image row before trying carousel or video batches.

## Helpful Links

- [AI Agent Skill](https://github.com/devadio/post-skill)
- [Latest Copy of the Sheet](https://docs.google.com/spreadsheets/d/1oyiLNgJnEFzdpQBjnNcbbArseX_FZvjrdjH24mnGuME/copy)
- [Support](https://devad.io/contact-us/)
