# POST.devad.io Google Sheet Automation Guide

This guide explains how to use the current Google Sheet automation setup step by step.

## What This Sheet Does

This sheet lets you prepare social media posts in Google Sheets and publish them through `POST.devad.io` using Apps Script automation.

The current script is designed to be simple:

- You enter your post data in the `post` tab.
- You enable the platforms you want in the sidebar.
- The script checks the next queued row and sends it to the API.

## First-Time Setup

1. Open the Google Sheet.
2. In the top menu, click `POST.devad.io`.
3. Click `Publication Manager`.
4. Paste your API token.
5. Add the Integration ID for each platform you want to use.
6. For Pinterest, also add the Board ID.
7. Choose your automation frequency in the `Automation` section.
8. Click `SAVE & RUN SYNC`.

Generate your token and platform IDs here:

[POST.devad.io Settings](https://post.devad.io/app/profile/settings)

## Sheet Rules

Use a sheet tab named:

- `post`

Do not change:

- Row 1 headers
- Dropdown menus
- Internal helper fields unless you are intentionally updating the system

## Fields You Should Fill

The normal working area starts from row 2.

- `B2:B` Promo Link
- `C2:C` Title
- `D2:D` Caption
- `E2:E` Media URL
- `F2:F` Media Type
- `G2:G` Action

## Current Column Layout

- `A` Reference
- `B` Promotional link
- `C` Title
- `D` Social media summary (caption)
- `E` Creative link
- `F` Creative type
- `G` Action?
- `H` Check
- `I` Log

## How To Queue a Post

To queue a new post:

1. Fill the content fields in the row.
2. Put the media link in column `E`.
3. Set the creative type in column `F`.
4. Set column `G` to `Not yet` or `To do`.
5. Run `SAVE & RUN SYNC` or wait for automation.

## Supported Creative Types

This current version supports only:

- `image_manual`
- `video_manual`
- `carousel_manual`

If you use another value, the script may skip the row or fail validation.

## What the AI Agent Should Edit

If an AI agent is filling the sheet, it should only write to:

- Promo Link: `B2:B`
- Title: `C2:C`
- Caption: `D2:D`
- Media URL: `E2:E`
- Media Type: `F2:F`
- Action: `G2:G`

The AI agent should avoid changing:

- Row 1
- Validation/dropdown cells
- platform setup/configuration values unless asked

## What Happens After a Run

- Column `G` (`Action?`) will be updated based on the result
- Column `I` (`Log`) will show the latest result message

Examples:

- successful publish
- skipped platforms
- validation failure
- media or API error

## Tips

- Keep media URLs public and accessible.
- Use Google Drive file links for single media items.
- Use Google Drive folder links for carousel posts.
- Make sure the correct platforms are enabled in the manager.
- If a platform does not support the media type, the script may skip it.

## Where To Manage Automation

Use the menu:

- `POST.devad.io` -> `Publication Manager`

From there you can:

- save your token
- enable or disable platforms
- control Pinterest board settings
- set automation frequency
- run a manual sync

## Useful Links

- [AI Agent Skill](https://github.com/devadio/post-skill)
- [Latest Copy of the Sheet](https://docs.google.com/spreadsheets/d/1oyiLNgJnEFzdpQBjnNcbbArseX_FZvjrdjH24mnGuME/copy)
- [Support](https://devad.io/contact-us/)

## Need the Full Version?

If you want the full version, advanced logic, or deeper support, please contact us:

[Contact Us](https://devad.io/contact-us/)
