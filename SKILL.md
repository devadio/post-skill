---
name: post-api
description: "Schedule and publish content to social networks including Facebook Page, Instagram, LinkedIn, TikTok, YouTube, Pinterest, and Telegram via the Devad.io POST API. Supports text, images, carousels, and videos. Use this skill to post content programmatically without the social media dashboard."
---

# POST API (post.devad.io)

Publish content to 8+ social media platforms via a single REST API call. The API is hosted at `post.devad.io` and is a SaaS that wraps platform-specific publishing logic.

## Documentation
- Platform: `https://post.devad.io`
- Base API URL: `https://post.devad.io/api/public/v1`

---

## Setup

1. Log in to [post.devad.io](https://post.devad.io)
2. Connect your social accounts in the Social Accounts manager.
3. Go to **Account Settings → POST API** to generate an **API Token**.
4. In the same POST API settings page, copy the **Integration IDs** for the accounts you want to post to (one unique ID per social account).

---

## Authentication

All requests require a Bearer token header:

```
Authorization: Bearer YOUR_API_TOKEN
```

> **Note:** Some server environments (e.g. Nginx FastCGI / Webuzo) strip the `Authorization` header. Use the fallback `X-Api-Token: YOUR_API_TOKEN` header, or the **Query Parameter Bypass** (recommended for large media uploads): `?api_token=YOUR_API_TOKEN`.

---

## Core Workflow

```
1. Get Integration IDs → GET /accounts
2. Build payload with integration ID + content + media URLs
3. POST /posts → API returns 202 Accepted
4. Job queued → Platform publishes within 1-3 minutes
```

---

## Endpoints

### GET /accounts
Returns all connected social accounts with their Integration IDs.

```bash
curl -H "Authorization: Bearer TOKEN" \
     https://post.devad.io/api/public/v1/accounts
```

### POST /upload (Optional, Required for TikTok)
Upload an image or video to the internal Devad.io S3 bucket.
> **When to use this:**
> 1. **TikTok**: TikTok rejects external URLs (like Wikipedia or Imgur) with `url_ownership_unverified`. You **MUST** upload your media file here first. Once uploaded to `media.devad.io`, TikTok accepts **any aspect ratio** (9:16, horizontal, square) and any duration, just like the manual dashboard.
> 2. **LinkedIn**: LinkedIn's downloader gets a `403 Forbidden` from heavily protected sites like Wikipedia. Uploading the image here first bypasses that protection.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
# OR Query Parameter (Fixes Nginx header-stripping for >10MB files)
POST https://post.devad.io/api/public/v1/upload?api_token=YOUR_TOKEN
```

**Request Body (`multipart/form-data`):**
| Field | Type | Description |
|---|---|---|
| `file` | file | The video or image file (max 50MB for images, 500MB for videos). Allowed: jpeg, png, webp, mp4 |

**Response (201 Created):**
```json
{
  "url": "https://media.devad.io/15d7e24abb1344e89d4162b733ca3eb9:post.devad.io/files/image-1_hgAdiw.png",
  "mime_type": "image/png",
  "size": 102400,
  "name": "image.png"
}
```

### POST /posts
Create and publish/schedule posts.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
Accept: application/json
```

**Request Body:**
```json
{
  "type": "now",
  "posts": [
    {
      "integration": { "id": "INTEGRATION_ID" },
      "value": [
        {
          "content": "Your caption #hashtags",
          "image": ["https://example.com/image.jpg"],
          "video": []
        }
      ],
      "settings": {}
    }
  ]
}
```

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `type` | string | `"now"` (post instantly) or `"schedule"` (requires `date`) |
| `date` | string | ISO-8601 datetime, e.g. `"2026-12-31T23:59:00Z"` (required if `type=schedule`) |
| `posts[].integration.id` | string | 10-char Integration ID from dashboard |
| `posts[].value[].content` | string | Caption/text (max 5000 chars) |
| `posts[].value[].image` | array | Array of public image URLs (max 10 for IG carousel) |
| `posts[].value[].video` | array | Array of public video URLs (usually 1) |
| `posts[].settings` | object | Platform-specific overrides (see per-platform notes) |

You can post to **up to 10 accounts in one request** by adding multiple objects to the `posts` array.

---

## Successful Response (202 Accepted)

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "status": "queued",
        "integration": { "id": "oSxbmYoPoP", "provider": "facebook", "category": "page" },
        "scheduled_at": "2026-03-26T08:00:00Z",
        "post_type": "carousel",
        "media_count": 3
      }
    ]
  }
}
```

> Publishing is **asynchronous**. After the 202 response, the platform post appears within 1–3 minutes depending on media type and platform queuing.

---

## Response Codes

| Code | Meaning |
|---|---|
| `202` | Accepted — job queued successfully |
| `401` | Unauthorized — token missing, expired, or invalid |
| `404` | Account ID not found or disconnected |
| `422` | Validation error — malformed JSON or missing required fields |

---

## Verified Payload Examples (All tested ✅)

### Facebook — Text Only
```json
{
  "type": "now",
  "posts": [{
    "integration": { "id": "FACEBOOK_INTEGRATION_ID" },
    "value": [{ "content": "Hello from the POST API! #test" }]
  }]
}
```

### Facebook — Image
```json
{
  "type": "now",
  "posts": [{
    "integration": { "id": "FACEBOOK_INTEGRATION_ID" },
    "value": [{ "content": "Check this out!", "image": ["https://example.com/photo.jpg"] }]
  }]
}
```

### Instagram — Carousel (multiple images)
```json
{
  "type": "now",
  "posts": [{
    "integration": { "id": "INSTAGRAM_INTEGRATION_ID" },
    "value": [{
      "content": "Swipe to see more! 👉",
      "image": [
        "https://example.com/slide1.jpg",
        "https://example.com/slide2.jpg",
        "https://example.com/slide3.jpg"
      ]
    }]
  }]
}
```

### LinkedIn — Multiple Images (Grid)
> **Important:** The API currently posts arrays of images to LinkedIn as a **multi-image grid**, not a swipeable PDF carousel. Natively, LinkedIn requires a PDF document to create a true swipeable carousel, which is not automatically generated by this API from image arrays.
```json
{
  "type": "now",
  "posts": [{
    "integration": { "id": "LINKEDIN_INTEGRATION_ID" },
    "value": [{
      "content": "Check out these photos! 👉",
      "image": [
        "https://example.com/slide1.jpg",
        "https://example.com/slide2.jpg"
      ]
    }]
  }]
}
```

### Facebook / LinkedIn / YouTube — Video
```json
{
  "type": "now",
  "posts": [{
    "integration": { "id": "FACEBOOK_INTEGRATION_ID" },
    "value": [{ "content": "Our new video! 🎬", "video": ["https://example.com/video.mp4"] }]
  }]
}
```
> **Important:** Video URLs are passed directly to the platform (not proxied through S3). Use a stable, publicly accessible HTTPS video URL.

### Instagram — Reel (video with forced reel type)
```json
{
  "type": "now",
  "posts": [{
    "integration": { "id": "INSTAGRAM_INTEGRATION_ID" },
    "value": [{ "content": "Behind the scenes! 🎬", "video": ["https://example.com/reel.mp4"] }],
    "settings": { "post_type": "reel" }
  }]
}
```
> **Required:** Instagram videos MUST include `"settings": { "post_type": "reel" }` to be published as a Reel.

### TikTok — Video (with privacy & music consent)
```json
{
  "type": "now",
  "posts": [{
    "integration": { "id": "TIKTOK_INTEGRATION_ID" },
    "value": [{ "content": "Check this out! #fyp", "video": ["https://example.com/video.mp4"] }],
    "settings": {
      "privacy": "PUBLIC_TO_EVERYONE",
      "duet": false,
      "stitch": false,
      "comment": true,
      "disable_download": false,
      "music_usage_confirmed": true,
      "autoAddMusic": "no"
    }
  }]
}
```
> **TikTok privacy values:** `PUBLIC_TO_EVERYONE` | `MUTUAL_CAN_VIEW` | `FOLLOWER_OF_CREATOR` | `SELF_ONLY`
> Use `SELF_ONLY` during testing, switch to `PUBLIC_TO_EVERYONE` after TikTok app approval.
> **Note:** The API automatically forces music consent (`tt_consent=1`) to prevent dashboard validation errors. You can pass `"music_usage_confirmed": true` or `"autoAddMusic": "no"` to match Postiz payload standards.

### YouTube — Video (with title and visibility)
```json
{
  "type": "now",
  "posts": [{
    "integration": { "id": "YOUTUBE_INTEGRATION_ID" },
    "value": [{ "content": "My video description #youtube", "video": ["https://example.com/video.mp4"] }],
    "settings": {
      "title": "My Video Title",
      "type": "public"
    }
  }]
}
```
> **YouTube visibility:** `"public"` | `"unlisted"` | `"private"`. Use `"unlisted"` for testing.

### Pinterest — Image Pin (with board and title)
```json
{
  "type": "now",
  "posts": [{
    "integration": { "id": "PINTEREST_INTEGRATION_ID" },
    "value": [{ "content": "Amazing recipe! 🍕", "image": ["https://example.com/pin.jpg"] }],
    "settings": {
      "title": "My Pin Title",
      "board_id": "YOUR_PINTEREST_BOARD_ID",
      "link": "https://example.com"
    }
  }]
}
```

### Telegram — Text / Image / Video / Carousel
All work with the same structure. Telegram natively supports all types:
```json
{
  "type": "now",
  "posts": [{
    "integration": { "id": "TELEGRAM_INTEGRATION_ID" },
    "value": [{ "content": "📢 Update from the POST API!", "image": ["https://example.com/img.jpg"] }]
  }]
}
```

### Cross-Platform Blast (multiple accounts in one call)
```json
{
  "type": "now",
  "posts": [
    {
      "integration": { "id": "FACEBOOK_INTEGRATION_ID" },
      "value": [{ "content": "New post!", "image": ["https://example.com/promo.jpg"] }]
    },
    {
      "integration": { "id": "INSTAGRAM_INTEGRATION_ID" },
      "value": [{ "content": "New post!", "image": ["https://example.com/promo.jpg"] }]
    },
    {
      "integration": { "id": "LINKEDIN_INTEGRATION_ID" },
      "value": [{ "content": "We are excited to share our latest update." }]
    }
  ]
}
```

---

## Platform-Specific Notes

| Platform | Supported Types | Special Settings |
|---|---|---|
| Facebook Page | text, image, carousel, video | None required |
| Instagram | image, carousel, reel | `settings.post_type: "reel"` required for videos |
| LinkedIn Page/Profile | text, image, video | None required |
| TikTok | video, image | `settings.privacy` required |
| YouTube | video (unlisted/public/private) | `settings.title` and `settings.type` recommended |
| Pinterest | image, video | `settings.title` and `settings.board_id` recommended |
| Telegram | text, image, carousel, video | No extra settings needed |
| Twitter/X | text, image, carousel, video | Connect account first via dashboard |

---

## Scheduling a Future Post

```json
{
  "type": "schedule",
  "date": "2026-12-31T09:00:00Z",
  "posts": [{
    "integration": { "id": "FACEBOOK_INTEGRATION_ID" },
    "value": [{ "content": "Happy New Year! 🎉" }]
  }]
}
```

---

## Test Runner

A ready-to-use Node.js test script is included in `scripts/test_runner.js`.

```bash
# Check all connected accounts (run first!)
node test_runner.js accounts

# Test specific platform/type combinations
node test_runner.js facebook_image
node test_runner.js instagram_carousel
node test_runner.js instagram_video
node test_runner.js tiktok_video
node test_runner.js youtube_video
node test_runner.js telegram_text
```
