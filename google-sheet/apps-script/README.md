# Sheet-Claw Apps Script

This repo stores the Google Apps Script source for the POST.devad.io Google Sheet workflow.

## Local setup

1. Run `npm install`.
2. Run `npx clasp login`.
3. Create a local `.clasp.json` file:

```json
{
  "scriptId": "PASTE_APPS_SCRIPT_ID_HERE",
  "rootDir": "."
}
```

4. Push the local files to Apps Script:

```bash
npm run clasp:push
```

## GitHub auto-publish

The workflow at `.github/workflows/push-appsscript.yml` pushes `main` to Apps Script.

Add these GitHub repository secrets:

- `APPS_SCRIPT_ID`: the Apps Script project ID bound to the Google Sheet
- `CLASPRC_JSON`: the full contents of your local `~/.clasprc.json`

Once those two secrets are set, every push to `main` will update the live Apps Script project without copy-paste.

## Notes

- `.clasp.json` is ignored on purpose because it contains your live script ID.
- `~/.clasprc.json` must never be committed.
- The sheet tab used by the script must be named `post`.
- Rows are processed only when column `F` is `Not yet`.
