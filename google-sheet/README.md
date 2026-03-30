# Google Sheet Automation

This folder is the landing page for the Google Sheets workflow behind POST.devad.io.
It is meant for people who want to run the sheet-based automation, and also for AI agents or developers who want a clear reference for how the workflow is structured.

## What You Will Find Here

- `google-sheet/apps-script/` - the full Apps Script bundle mirrored from the live Sheet project
- `google-sheet/README.md` - this guide
- `google-sheet/apps-script/README.md` - setup and reference notes for the script bundle

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
