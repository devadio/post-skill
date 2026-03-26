# 🤖 POST.devad.io Agent Skill

> **The Cheapest & Most Powerful Social Media Scheduling Skill for AI Agents**

Supercharge your AI assistants (Claude, OpenClaw, AutoGPT, and custom LLM agents) with the ability to completely automate your social media presence. The **POST.devad.io Agent Skill** is a lightweight, high-performance integration that allows AI agents to generate, schedule, and publish content across the web with a single JSON payload.

---

## ✨ Why Choose POST.devad.io?

*   **🤑 Lowest Cost for AI Agents:** Starting at just **$5/mo**, this is significantly more affordable than traditional CLI or MCP-based tools that charge per action or per platform.
*   **🤖 AI-Optimized:** Designed specifically for LLMs. No complex OAuth flows for your agent—just a simple Integration ID and a clean REST API.
*   **🎥 Multi-Format Power:** Full support for AI-generated **Text, High-Res Images, and HD Video** (including 9:16 Reels/TikToks and Large 18MB+ uploads).
*   **🚀 100% Automated:** From the moment your agent dispatches the payload, our backend handles the platform queuing, media proxying, and reliable publishing.

---

## 🌐 Supported Channels (10+)

Reach your audience wherever they are. We support all major platforms:

1.  **TikTok** (Full support for any aspect ratio & large video files via internal proxy)
2.  **Instagram** (Reels, Stories, and Carousel posts)
3.  **Facebook** (Pages & Groups - Text, Image, Video, Carousel)
4.  **LinkedIn** (Page & Profile - Professional updates and Video)
5.  **YouTube** (Videos & Shorts with full metadata control)
6.  **Twitter / X** (Fast-paced text and media updates)
7.  **Pinterest** (High-traffic Pins and Video Pins)
8.  **Telegram** (Broadcast to Channels and Groups)
9.  **Google Business Profile** (Local SEO posts with images)
10. **Tumblr** (Creative blogs and media)

---

## 💰 Pricing

All-inclusive access to all platforms and features. No hidden costs.

*   **Monthly Plan:** $10 / mo
*   **Annual Plan:** $60 / year ($5 / mo)

---

## 🚀 Getting Started

### 1. Get Your API Key
Log in to [post.devad.io](https://post.devad.io), connect your accounts, and generate your API Token in **Account Settings → POST API**.

### 2. Implementation
Your agent simply needs to call our REST endpoint. A production-ready **Node.js Test Runner** is included in `scripts/test_runner.js`.

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
- `scripts/`: Production-ready test runners in **JavaScript** and **PHP**.
- `payloads/`: 20+ ready-to-use JSON samples for every platform and media type.

---

## 🤝 Support
Join our community or check out the full documentation at [devad.io/guides/topics/post-devad-io-docs/](https://devad.io/guides/topics/post-devad-io-docs/).
