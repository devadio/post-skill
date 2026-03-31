# 🚨 Post-Skill: The Ultimate AI & Human Social Media Scheduler

**Stop burning your tokens on repetitive publishing loops!** Post-Skill is your simple, low-cost, open-source solution to schedule and publish social media content with zero hassle. Skip the bloated dashboards, fragile custom API calls, and repetitive prompt instructions. Just add your content and media, and let the system handle the heavy lifting.

# Ai Agent Skill
Most posting APIs are too complex, causing prompt bloat, high token use, and hallucinated payloads. Post-Skill is built for AI agents to work faster with less guesswork and fewer tokens.
* **Quick Onboarding:** Feed your AI the [MASTER_PROMPT.md](MASTER_PROMPT.md) to get it executing instantly.
* **Technical Docs:** Point your agent to [SKILL.md](SKILL.md) for the complete rules and technical documentation.
* **Ready Payloads:** Use the ready-made JSON examples in the [`payloads/`](payloads/) folder for guaranteed safe formatting.
* **Testing:** Leverage local test runners in `scripts/test_runner.js` and `scripts/test_runner.py` for product-ready examples.

# N8N
Stop building massive, tangled workflows with separate nodes for every single platform. Instead, just have n8n send the final content to the API or Sheet, and let the scripts handle the actual publishing. 
* **Cheapest Practical Tool:** Enjoy a lower operating cost than typical dashboard-first tools, perfect for creators, agencies, founders, and growing teams.
* **Validate Webhooks First:** Catch common mistakes before live publishing using the included local test runners:
```bash
node scripts/test_runner.js health
node scripts/test_runner.js facebook_carousel --dry-run --print-payload
python scripts/test_runner.py instagram_video --dry-run --print-payload
```

# Google Sheet for Human & Agent
The Google Sheet workflow is one of the strongest parts of this repo—a powerful engine for bulk planning and queue-based scheduling.
For Humans: Enjoy zero learning curve, easy bulk planning, and having all your content visible in one single place.
For AI Agents: The sheet acts as a structured database where rows are easily read and updated, media links are processed safely, and remote posting is executed flawlessly.
Get The Sheet Guide: Start with the [Google Sheet Guide](https://www.google.com/search?q=google-sheet/README.md) to set up your workflow.
Apps Script Engine: The [google-sheet/apps-script/](https://www.google.com/search?q=google-sheet/apps-script/README.md) folder is a full working reference bundle that automatically turns the sheet into a publishing queue, detects media types, builds payloads, and writes results back. It exposes a lightweight sheet API for AI agents and serves as a blueprint for other languages.

✅ **Supported Formats & Safe Post Types**
Post-Skill safely supports the most useful social post types when using stable media links:
Text: Safest for short updates, CTAs, and announcements. Useful for Facebook, LinkedIn, X, Telegram, Tumblr, and Google Business.
Single Image: Safest formats are jpg, jpeg, png, and webp. Use one direct public image URL or a Google Drive file with public view access (or stable CDN).
Carousel: Safest workflow is a Google Drive folder link containing only the intended images. Avoid nested folders, shortcuts, and unsupported files.
Video / Reels / Shorts: Safest format is mp4. Use one stable public video URL and avoid preview pages, login walls, and expiring links.
Safe Google Sheet Creative Types: Use image_manual, video_manual, or carousel_manual for the current workflow.

🌍 **Supported Channels**
Automate workflows for 10 platforms (behavior depends on account setup and media type):
TikTok
Instagram
Facebook
LinkedIn
YouTube
X / Twitter
Pinterest
Telegram
Tumblr
Google Business Profile
---

## Repository Structure

- `SKILL.md`: the main skill and technical documentation
- `ARTICLE.md`: a shorter human-focused overview
- `MASTER_PROMPT.md`: a quick onboarding prompt for AI assistants
- `scripts/`: production-ready test runners in JavaScript and Python
- `payloads/`: ready-to-use JSON examples for platforms and media types
- `google-sheet/`: Google Sheets automation guide
- `google-sheet/apps-script/`: full Apps Script reference bundle

---

## Support

- **Start posting everywhere today:** [post.devad.io](https://post.devad.io)
- **Read the main documentation:** [SKILL.md](SKILL.md)
- **Google Sheet workflow:** [google-sheet/README.md](google-sheet/README.md)
- **Support:** [devad.io/guides/topics/post-devad-io-docs/](https://devad.io/guides/topics/post-devad-io-docs/)
