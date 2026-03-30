# 🤖 POST.devad.io Agent Skill

POST.devad.io is the heavy-lifting layer. The skill, scripts, and publishing service handle queueing, payload shaping, uploads, retries, and logging so the AI agent can stay focused on generating the content and media.

Instead of reinventing the automation plumbing, the agent only needs to decide what to post, which media to use, and when to publish it.

It also now includes a Google Sheets Apps Script Web App API pattern, so an AI agent can read rows as JSON and make tightly restricted updates through a lightweight token-protected sheet endpoint when that workflow fits better than direct API posting.

---

## ✨ Why You'll Love It (The Benefits)

*   **🌍 Massive Reach on Autopilot:** Send **one prompt** and push your content directly to TikTok, Instagram, LinkedIn, YouTube, Facebook, Pinterest, Google Business, Telegram, Tumblr, and X.
*   **🔌 Plug-and-Play AI Integration:** Seamlessly connect your custom GPTs, Claude, OpenClaw, or n8n workflows. Just hand your AI the API key and let it take over.
*   **🎥 Heavy-Duty Media Support:** Don't worry about compressing files. We handle high-def uploads up to **500MB** for video and **50MB** for images.
*   **🚀 100% Automated:** From the moment your agent dispatches the payload, our backend handles platform queuing and reliable publishing.

---

## 🌐 Supported Channels (10+)

Reach your audience wherever they are. We support all major platforms:

1.  **TikTok** (Full support for any aspect ratio & large video files via internal proxy)
2.  **Instagram** (Reels, Stories, and Carousel posts)
3.  **Facebook** (Pages Only - Text, Image, Video, Carousel)
4.  **LinkedIn** (Page & Profile - Professional updates and Video)
5.  **YouTube** (Videos & Shorts with full metadata control)
6.  **Twitter / X** (Fast-paced text and media updates)
7.  **Pinterest** (High-traffic Pins and Video Pins)
8.  **Telegram** (Broadcast to Channels and Groups)
9.  **Tumblr** (Creative blogs and media)
10. **Google Business Profile** (Local SEO posts with images)

---

## 🥊 The Reality Check (Why overpay?)

Look, tools like **Postiz** and **Blotaot** are great, but why are you paying **$29/month** just to schedule your posts? 

We are on a mission to build *AI Tools & Services Every Business Needs to Grow*, which means giving you enterprise-level power without the enterprise price tag.

With POST.devad.io, you get **ALL features unlocked** for a fraction of the cost:
*   **💸 Monthly Freedom:** Only $10/mo (Cancel anytime)
*   **🔥 Annual Power:** Just $5/mo ($60 billed annually)

---

## 🚀 Getting Started

### 1. Get Your API Key
Log in to [post.devad.io](https://post.devad.io), connect your accounts, and generate your API Token in **Account Settings → POST API**.

### 2. Implementation
Your agent simply needs to call our REST endpoint. Production-ready test runners are included in `scripts/test_runner.js` and `scripts/test_runner.py`.

Quick validation commands:

```bash
node scripts/test_runner.js health
node scripts/test_runner.js facebook_carousel --dry-run --print-payload
python scripts/test_runner.py instagram_video --dry-run --print-payload
```

The runners are designed to catch the common mistakes we hit during the Google Sheet project before a developer sends a live publish request.

---

## Google Sheet Automation

If you want the spreadsheet-based workflow, start here:

- [Google Sheet Guide](google-sheet/README.md)
- [Apps Script Bundle](google-sheet/apps-script/README.md)

The Apps Script folder is a full working reference for turning a Google Sheet into a publishing queue. It shows how the row data is read, how media is detected, how each platform gets its own payload, how results are written back into the sheet, and how to expose a small web-app API for lightweight AI agents.

Because it is a complete implementation, an AI agent can also use it as a blueprint to customize the same workflow in other environments or programming languages.

---

## 🤖 Master Prompt for AI Agents

Want to give your AI (Claude, OpenClaw, etc.) instant social media powers? Copy the block below and paste it into your agent's chat along with your API Token.

> **Note:** For the full, customizable version, see [MASTER_PROMPT.md](MASTER_PROMPT.md).

```text
Act as a Social Media Automation Agent. Use the POST.devad.io skill (https://github.com/devadio/post-skill) to manage my social media. 

1. Call GET /accounts to see my connected platforms.
2. Use POST /posts to publish content using my Integration IDs.
3. For videos (especially TikTok), upload via POST /upload first.

My API Token: [PASTE_YOUR_TOKEN_HERE]
```

---

### 3. Example AI Agent Payload
```json
{
  "posts": [{
    "integration": { "id": "TIKTOK_ID" },
    "value": [{
      "content": "AI-generated content is here! 🚀",
      "video": ["https://your-ai-cdn.com/video.mp4"]
    }],
    "settings": {
      "privacy": "PUBLIC_TO_EVERYONE",
      "music_usage_confirmed": true
    }
  }],
  "type": "now"
}
```

---

## 🛠️ Repository Structure

- `SKILL.md`: Theoretical framework and full API documentation.
- `ARTICLE.md`: A human-focused guide to automating your social media.
- `MASTER_PROMPT.md`: One-click onboarding for AI Assistants.
- `scripts/`: Production-ready test runners in **JavaScript** and **Python**.
- `payloads/`: 20+ ready-to-use JSON samples for every platform and media type.
- `google-sheet/`: Google Sheets automation guide and documentation.
- `google-sheet/apps-script/`: Full Apps Script reference bundle for the live sheet workflow.

---

## 🤝 Support
Join our community or check out the full guide at [devad.io/guides/topics/post-devad-io-docs/](https://devad.io/guides/topics/post-devad-io-docs/).

🔗 **Start posting everywhere today:** [post.devad.io](https://post.devad.io)  
📖 **Read the full launch guide:** [ARTICLE.md](ARTICLE.md)

#AIAutomation #SaaS #BuildInPublic #n8n #SocialMediaMarketing #Developers #POSTdevad
