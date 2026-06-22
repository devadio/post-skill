# Live Proof Payload Examples

This folder contains sanitized private proof payload copies from the CORE POST
API proof runs.

Use `MANIFEST.md` as the complete index. It is generated from production POST
API publication summaries and includes the current PASS/API_ONLY result, core
publication id, provider, variant, and payload filename.

Highlights:

- Facebook first-comment proof passed as core post `98`; both the post marker
  and first-comment marker were visible on the Facebook post page.
- Instagram feed image first-comment proof passed as core post `99`; both the
  caption marker and first-comment marker were visible on the Instagram post.
- Earlier successful payloads were backfilled from production POST API
  summaries and `.tmp` proof state so the archive covers Facebook, Instagram,
  Telegram Channel, Telegram Group, Pinterest, TikTok, YouTube, Google
  Business, LinkedIn, and Tumblr proof formats.
- Instagram Story image/video are saved as `API_ONLY`, not `PASS`, because CORE
  published them but external visual marker capture was not possible with the
  available browser tooling.

These files are examples, not reusable templates. Use the placeholder templates
from `payloads/*.json` for new runs.

No API keys, OAuth tokens, cookies, access tokens, or raw provider responses
belong in this folder.
