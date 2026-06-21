# Google Sheet Automation Reference

This folder is a legacy reference for the old POST.devad.io Google Sheet workflow.

Do not run the included Apps Script bundle as current CORE live automation until it is migrated and retested.

## Current CORE Target

| Item | Required value |
|---|---|
| API base | `https://devad.io/api/v1/post` |
| Auth | `Authorization: Bearer wsk_...` |
| Secret storage | Apps Script properties or private runtime config only |
| Default mode | dry-run / validate |
| Live writes | explicit user approval plus a live-write gate |
| Idempotency | stable row/campaign correlation id |
| Errors | preserve CORE `block_states`, warnings, and blocking reasons |

## Legacy Files

- `google-sheet/apps-script/PostService.gs`
- `google-sheet/apps-script/SheetUI.gs`
- `google-sheet/apps-script/ConfigService.gs`
- `google-sheet/apps-script/WebAppApi.gs`
- supporting HTML and setup files

These files may still contain old public API names, old token property names, and query-token compatibility code. Treat them as row/UI/workflow references only.

## Migration Checklist

Before using the Sheet workflow with CORE:

1. Replace the old public API base with `https://devad.io/api/v1/post`.
2. Remove query-token auth and any `X-Api-Token` header.
3. Use only `Authorization: Bearer wsk_...` from private Apps Script properties.
4. Add dry-run as the default action.
5. Add a live-write gate requiring explicit user confirmation.
6. Generate stable idempotency/correlation IDs per row.
7. Validate provider, channel, variant, media MIME/count/ratio/duration before payload build.
8. Write CORE `block_states`, warnings, and blocking reasons back to the sheet.
9. Process one row or one small batch at a time by default.
10. Verify exact external provider markers before marking a row as passed.

## Safe Use Today

Use this folder to understand:

- Sheet column design,
- row normalization,
- media URL/folder handling,
- private setting UI concepts,
- status/log writeback.

Do not use it for live CORE writes until the migration checklist above is complete and dry-run tests pass.
