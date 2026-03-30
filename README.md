# Post-Skill: The Ultimate AI and Human Social Media Scheduler

Welcome to **Post-Skill**, a simple, low-cost, open-source way to schedule and publish social media content with much less hassle.

This project is built for both humans and AI agents. Instead of wasting time on bloated dashboards, fragile custom API calls, and repetitive prompt instructions, Post-Skill gives you a clean system for:

- creating content
- attaching media
- choosing channels
- scheduling or publishing faster

Just add your content and media, and get ready to grow your social media and reach your audience faster than ever.

---

## Top Things That Make It Different

### 1. The Cheapest Practical Social Media Tool

Many social media schedulers charge high monthly fees just to let you publish posts.

Post-Skill is different because it focuses on simple, practical automation:

- low-friction workflows
- lightweight setup
- lower operating cost than typical dashboard-first tools
- useful for creators, agencies, founders, and growing teams

### 2. Open-Source, Clean, and Fast for AI Agents

Most posting APIs are too complex for lightweight agents. That creates extra prompt bloat, more token use, more failures, and more hallucinated payloads.

Post-Skill solves that with:

- open-source scripts
- product-ready examples
- simple test runners
- a clear `SKILL.md`
- Google Sheet workflows that are easy to understand

This helps AI agents work faster with less guesswork and less token usage.

### 3. A Powerful Google Sheet Engine for Humans and AI

The Google Sheet workflow is one of the strongest parts of this repo.

For humans:

- bulk planning is easy
- content is visible in one place
- there is almost no learning curve

For AI agents:

- the sheet becomes a structured database
- rows are easy to read and update
- media links are easy to process
- remote posting becomes faster and safer

---

## What It Helps You Do

Post-Skill helps you simplify social media scheduling with less hassle by giving you ready-made workflows for:

- multi-channel posting
- media upload handling
- Google Sheet queue-based scheduling
- direct API posting
- AI-agent friendly automation
- lightweight remote content operations

The human or agent focuses on the content. The scripts and workflows handle the heavy lifting.

---

## Supported Formats and Safe Post Types

Post-Skill supports the most useful social post types safely when you use stable media links and the recommended formats.

### Text

- useful for Facebook, LinkedIn, X, Telegram, Tumblr, and Google Business text-style posts
- safest for short updates, CTA posts, and announcements

### Single Image

- safest formats: `jpg`, `jpeg`, `png`, `webp`
- best source: one direct public image URL
- preferred source: Google Drive file with public view access or a stable CDN/media URL

### Carousel

- safest workflow: a Google Drive folder link
- put only the intended carousel images inside the folder
- avoid nested folders, shortcuts, and unsupported files

### Video / Reels / Shorts

- safest format: `mp4`
- use one stable public video URL
- avoid preview pages, login walls, and expiring links

### Safe Google Sheet Creative Types

For the current Google Sheet workflow, the safest supported values are:

- `image_manual`
- `video_manual`
- `carousel_manual`

---

## Supported Channels

Post-Skill can support posting workflows for:

1. TikTok
2. Instagram
3. Facebook
4. LinkedIn
5. YouTube
6. X / Twitter
7. Pinterest
8. Telegram
9. Tumblr
10. Google Business Profile

Platform behavior still depends on account setup, media type, and the workflow you choose.

---

## Why It Saves Hassle and Tokens

Without a structured tool, an AI agent often has to:

- guess payload formats
- rebuild posting logic
- retry uploads manually
- learn platform quirks each time
- spend extra tokens on trial and error

Post-Skill reduces that waste by giving the agent:

- clear scripts
- ready-made workflows
- tested payload patterns
- Google Sheet automation
- simpler control surfaces

That means less hassle for humans and less wasted token usage for AI agents.

---

## Getting Started

### 1. Get Your API Key

Log in to [post.devad.io](https://post.devad.io), connect your accounts, and generate your API Token in **Account Settings -> POST API**.

### 2. Choose Your Workflow

You can use Post-Skill in three practical ways:

- direct API usage
- local test runners in `scripts/test_runner.js` and `scripts/test_runner.py`
- Google Sheet automation in [`google-sheet/`](google-sheet/README.md)

### 3. Validate First

The included runners help catch common mistakes before live publishing.

```bash
node scripts/test_runner.js health
node scripts/test_runner.js facebook_carousel --dry-run --print-payload
python scripts/test_runner.py instagram_video --dry-run --print-payload
```

---

## Google Sheet Automation

If you want the spreadsheet-based workflow, start here:

- [Google Sheet Guide](google-sheet/README.md)
- [Apps Script Bundle](google-sheet/apps-script/README.md)

The Apps Script folder is a full working reference for:

- turning a Google Sheet into a publishing queue
- reading row data safely
- detecting media type
- building platform-specific payloads
- writing results back into the sheet
- exposing a lightweight sheet API for AI agents

Because it is a complete implementation, an AI agent can also use it as a blueprint for other languages or environments.

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
