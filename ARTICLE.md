# Automate Social Media with Less Hassle Using Post-Skill

Post-Skill is a practical social media scheduling system for both humans and AI agents.

It is designed to make publishing easier, cheaper, and faster by combining:

- ready-made scripts
- a clear skill file
- direct API workflows
- a powerful Google Sheet workflow

Instead of rebuilding the same posting logic every time, you can focus on content and media while the workflow handles the hard part.

---

## Why It Feels Different

### 1. It is cheap and practical

Post-Skill is built as a lightweight alternative to expensive social media schedulers.

### 2. It is easier for AI agents to use correctly

The scripts and `SKILL.md` reduce guesswork, reduce failure, and reduce wasted prompt tokens.

### 3. The Google Sheet workflow is powerful for both humans and AI

Humans can plan content in a familiar spreadsheet. AI agents can read rows, process media links, and help post remotely much faster.

---

## Safe Formats

The safest content formats in this project are:

- text posts
- single image posts
- carousel posts
- video posts

For the Google Sheet workflow, use:

- `image_manual`
- `video_manual`
- `carousel_manual`

Safest inputs:

- single image: direct public image URL
- video: stable public `mp4` URL
- carousel: Google Drive folder link containing the intended images

Google Drive works best when files or folders are viewable by anyone with the link.

---

## Why It Reduces Hassle

Post-Skill helps you avoid:

- switching between too many dashboards
- re-uploading media over and over
- manually debugging social API payloads
- spending too many AI tokens on custom posting logic

It gives you a faster path from:

- content idea
- media asset
- selected channel

to:

- published post

---

## How to Get Started in 3 Steps

1. Connect your accounts at [post.devad.io](https://post.devad.io)
2. Generate your API token in **Account Settings -> POST API**
3. Use the API, test runners, or Google Sheet workflow to start automating

---

## Continue Here

- **Main documentation:** [SKILL.md](SKILL.md)
- **Google Sheet workflow:** [google-sheet/README.md](google-sheet/README.md)
- **Start here:** [post.devad.io](https://post.devad.io)
- **Support:** [devad.io/guides/topics/post-devad-io-docs/](https://devad.io/guides/topics/post-devad-io-docs/)
