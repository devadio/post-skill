# Live Proof Payload Examples

These files are exact or normalized private proof payload copies from the CORE
POST API proof run. They are examples, not reusable templates.

Use the reusable placeholder templates from `payloads/*.json` for new runs.
Use these only when comparing a known proof shape.

| File | Result | Notes |
| --- | --- | --- |
| `telegram_channel_document.pass.20260622-101109.json` | PASS | CORE published post `68`; external marker visible in Telegram Web. |
| `youtube_video_upload.pass.20260622-113257.json` | PASS | CORE published post `74`; external marker visible on YouTube. |
| `google_business_standard.pass.20260622-114331.json` | PASS | CORE published post `75`; exact marker visible in owner Google Search Updates tab after hard refresh. |
| `linkedin_text.blocked-auth.20260622-103909.json` | Blocked | API create reached CORE, provider failed with revoked LinkedIn OAuth. |
| `linkedin_image.blocked-auth.20260622-103909.json` | Blocked | API media/create reached CORE, provider failed with revoked LinkedIn OAuth. |

No API keys, OAuth tokens, cookies, or raw provider responses belong in this
folder.
