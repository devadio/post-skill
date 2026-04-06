# StackPost Custom Modifications Registry
> **Purpose**: This file documents every custom change made OUTSIDE the `PostApi` module.  
> If StackPost releases an update that overwrites any of these files, use this guide to re-apply all changes.  
> Written for AI-assisted restoration — each section is self-contained with exact file paths, diffs, and commands.

---

## 📋 Table of Contents

1. [Facebook Pages — OAuth Permissions Fix](#1-facebook-pages--oauth-permissions-fix)
2. [Facebook Pages — First Comment UI](#2-facebook-pages--first-comment-ui)
3. [Facebook Pages — Post Facade (Stories, Comments, Reels)](#3-facebook-pages--post-facade-stories-comments-reels)
4. [Instagram Profiles — Post Facade (Stories, Comments)](#4-instagram-profiles--post-facade-stories-comments)
5. [Deploy Script](#5-deploy-script)
6. [Known Architecture Issues](#6-known-architecture-issues)
7. [Restoration Checklist](#7-restoration-checklist)

---

## 1. Facebook Pages — OAuth Permissions Fix

**File**: `modules/AppChannelFacebookPages/app/Http/Controllers/AppChannelFacebookPagesController.php`

### What was broken
Two bugs existed in the original file:

1. **Missing `pages_manage_engagement` permission** — required for posting first comments on Facebook posts.
2. **OAuth array structure bug** — the Facebook SDK requires permissions as `['scope1', 'scope2']` but the original code passed `['scope1,scope2,scope3']` (entire string as one element), which meant ALL permissions beyond the first were silently ignored during OAuth.

### Changes to apply

**In `__construct()` — around line 19**, replace:
```php
$appPermissions  = get_option("facebook_page_permissions", "pages_read_engagement,pages_manage_posts,pages_show_list,business_management");
```
With:
```php
$appPermissions  = get_option("facebook_page_permissions", "pages_read_engagement,pages_manage_posts,pages_show_list,business_management,pages_manage_engagement");
// Always ensure pages_manage_engagement is included (required for first comment feature)
if (!str_contains($appPermissions, 'pages_manage_engagement')) {
    $appPermissions .= ',pages_manage_engagement';
}
```

**In `oauth()` method — around line 143**, replace:
```php
$permissions = [ $this->scopes ];
$login_url = $helper->getLoginUrl( module_url() , $permissions);
```
With:
```php
// Split comma-separated scopes into individual array elements as required by the FB SDK
$permissions = array_map('trim', explode(',', $this->scopes));
$login_url = $helper->getLoginUrl( module_url() , $permissions);
```

### After applying
- Deploy the file to the live server
- **Users must disconnect and reconnect their Facebook Page** to get a new token with the new scope
- Meta Developer Console: ensure `pages_manage_engagement` has **Standard Access** (no review needed)

---

## 2. Facebook Pages — First Comment UI

**File**: `modules/AppChannelFacebookPages/resources/views/options.blade.php`

### What was broken
The original template had no "First comment" textarea — only the "Post To" radio buttons. Instagram had the comment field but Facebook did not, causing UI inconsistency.

### Complete replacement content
Replace the entire file with:

```blade
<div class="mb-3">
    <div class="card shadow-none b-r-6">
        <div class="card-header px-3">
            <div class="fs-12 fw-6 text-gray-700">
                {{ __("Facebook") }}
            </div>
        </div>
        <div class="card-body px-3">
            <div class="mb-3">
                <div class="col-md-12">
                    <div class="mb-4">
                        <label class="form-label">{{ __('Post To') }}</label>
                        <div class="d-flex gap-8 flex-column flex-lg-row flex-md-column">
                            <div class="form-check me-3">
                                <input class="form-check-input" type="radio" name="options[fb_type]" value="feed" id="fb_type_1" checked>
                                <label class="form-check-label mt-1" for="fb_type_1">
                                    {{ __('Feed') }}
                                </label>
                            </div>
                            <div class="form-check me-3">
                                <input class="form-check-input" type="radio" name="options[fb_type]" value="reels" id="fb_type_2">
                                <label class="form-check-label mt-1" for="fb_type_2">
                                    {{ __('Reels') }}
                                </label>
                            </div>
                            <div class="form-check me-3">
                                <input class="form-check-input" type="radio" name="options[fb_type]" value="stories" id="fb_type_3">
                                <label class="form-check-label mt-1" for="fb_type_3">
                                    {{ __('Stories') }}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">{{ __('First comment') }}</label>
                        <textarea class="form-control input-emoji bbr-r-6 bbl-r-6" name="options[fb_comment]"></textarea>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

### Key differences from original
| Original | Fixed |
|----------|-------|
| `<div class="mb-0">` (Post To wrapper) | `<div class="mb-3"><div class="col-md-12"><div class="mb-4">` |
| No comment textarea | `<textarea name="options[fb_comment]" class="form-control input-emoji ...">` |

### After applying
```bash
php artisan view:clear
```
The `input-emoji` class triggers `Main.Emoji()` JS initialization automatically on page load.

> ⚠️ **Published views override warning**: If `resources/views/modules/appchannelfacebookpages/options.blade.php` exists on the live server, it takes priority over the module source. Always check and update BOTH locations, or delete the published copy so the module source is authoritative.

---

## 3. Facebook Pages — Post Facade (Stories, Comments, Reels)

**File**: `modules/AppChannelFacebookPages/app/Facades/Post.php`

### What was broken

| Method | Problem |
|--------|---------|
| `handleStories()` | Used invalid params (`photo_data`, `video_data`) — Facebook's API doesn't accept these |
| `handleDefault()` | Never called `postComment()` — first comments were never sent |
| `postComment()` | Did not exist at all |

### Critical logic to preserve

#### Story Publishing (Multi-step API)

**Photo Story — 2 steps:**
```php
// Step 1: Upload as unpublished
$upload = $FB->post($endpoint . 'photos', [
    'url'       => Media::url($media),
    'published' => false,
], $token)->getDecodedBody();
$photoId = $upload['id'];

// Step 2: Publish as story
$FB->post($endpoint . 'photo_stories', [
    'photo_id' => $photoId,
], $token);
```

**Video Story — 3 steps:**
```php
// Step 1: Start upload session
$start = $FB->post($endpoint . 'video_stories', [
    'upload_phase' => 'start',
], $token)->getDecodedBody();
$videoId = $start['video_id'];

// Step 2: Upload the video
$FB->post("/$videoId", [
    'file_url' => Media::url($media),
], $token);

// Step 3: Finish and publish
$FB->post($endpoint . 'video_stories', [
    'video_id'     => $videoId,
    'upload_phase' => 'finish',
], $token);
```

#### First Comment Logic
```php
protected static function postComment($FB, $postId, $post)
{
    if (!$postId) return;

    $data    = json_decode($post->data, false);
    $comment = $data->options->fb_comment ?? '';

    if (!empty(trim($comment))) {
        try {
            $FB->post("/$postId/comments", [
                'message' => $comment,
            ], $post->account->token);
            \Log::info('[FB Comment] Posted successfully', ['post_id' => $postId]);
        } catch (\Exception $e) {
            \Log::warning('[FB Comment] Failed', [
                'post_id' => $postId,
                'error'   => $e->getMessage(),
            ]);
        }
    }
}
```

#### `handleDefault()` must call `postComment()` after posting
```php
protected static function handleDefault($FB, $post, $data, $medias, $endpoint, $caption)
{
    [$endpoint, $params] = self::handleDefaultPost($FB, $post, $data, $medias, $caption, $endpoint);
    $response = $FB->post($endpoint, $params, $post->account->token)->getDecodedBody();
    $postId   = $response['id'] ?? null;

    // ✅ THIS LINE IS CRITICAL — must be present
    self::postComment($FB, $postId, $post);

    return [...];
}
```

### Full canonical file
The complete correct version is tracked in the GitHub repo at:
`POST-n8n/public_html--2apr-/public_html/modules/AppChannelFacebookPages/app/Facades/Post.php`

---

## 4. Instagram Profiles — Post Facade (Stories, Comments)

**File**: `modules/AppChannelInstagramProfiles/app/Facades/Post.php`

### 4.1 Story URL Case Bug Fix
A case-sensitivity bug in `handleSingleMediaPost()` caused Instagram Story permalinks to always generate as `/p/` (feed URLs) instead of `/stories/`.

**Change**: In `handleSingleMediaPost()` around line 112, change:
```php
$media_type === "stories" ? "stories" : "p"
```
To:
```php
$media_type === "STORIES" ? "stories" : "p"
```

### 4.2 Story Caption Rejection Bug
Instagram Graph API rejects story uploads if a `caption` field is present in the parameters.

**Change**: In `handleDefaultPost()` around line 154, add:
```php
// IG Graph API throws 'caption not valid for media_type STORIES' error if included.
if ($media_type === 'STORIES') {
    unset($params['caption']);
}
```

### 4.3 Comment Logging & Error Handling
Original method swallowed exceptions. Updated to log successes and failures.

**Change**: Replace `postComment()` method (around line 215) with:
```php
protected static function postComment($post_id, $comment, $post)
{
    if ($comment) {
        try {
            self::$fb->post("/" . $post_id . "/comments", [
                "message" => $comment
            ], $post->account->token)->getDecodedBody();
            \Log::info('[IG Comment] Posted successfully', ['post_id' => $post_id]);
        } catch (\Exception $e) {
            \Log::warning('[IG Comment] Failed', [
                'post_id' => $post_id,
                'error'   => $e->getMessage(),
            ]);
        }
    }
}
```

---

## 5. Deploy Script

**File**: `deploy.sh` (at live server root: `/home/postdev/public_html/deploy.sh`)

### Purpose
Syncs the GitHub repo subfolder (`POST-n8n/public_html--2apr-/public_html/`) → live server files, then clears Laravel caches.

### Usage
```bash
# Deploy all modules
bash /home/postdev/public_html/deploy.sh

# Deploy one specific module only
bash /home/postdev/public_html/deploy.sh AppChannelFacebookPages
bash /home/postdev/public_html/deploy.sh AppChannelInstagramProfiles
bash /home/postdev/public_html/deploy.sh PostApi
```

### Re-install on server after update wipes it
```bash
cp /home/postdev/public_html/POST-n8n/public_html--2apr-/public_html/deploy.sh \
   /home/postdev/public_html/deploy.sh
chmod +x /home/postdev/public_html/deploy.sh
```

---

## 6. Known Architecture Issues

### The "Dual Directory" Problem
The live server runs from `/home/postdev/public_html/` directly.  
The git repository tracks files under `/home/postdev/public_html/POST-n8n/public_html--2apr-/public_html/`.

**`git pull` alone does NOT update live files.** Always run `deploy.sh` after pulling.

### Published Views Override
Laravel's module system checks `resources/views/modules/{module}/` BEFORE the module's own `resources/views/`.  
If a view was ever published via `php artisan vendor:publish`, the published copy overrides the module source.

**To check for overrides:**
```bash
ls /home/postdev/public_html/resources/views/modules/appchannelfacebookpages/
ls /home/postdev/public_html/resources/views/modules/appchannelinstagramprofiles/
```

**To remove overrides (make module source authoritative):**
```bash
rm -rf /home/postdev/public_html/resources/views/modules/appchannelfacebookpages/
rm -rf /home/postdev/public_html/resources/views/modules/appchannelinstagramprofiles/
php artisan view:clear
```

### Facebook Token Scope Warning
When a Facebook Page is reconnected, the new token only includes scopes that were requested at OAuth time. If the controller's permission list is updated, users MUST reconnect their accounts to get tokens with the new scopes.

---

## 7. Restoration Checklist

Use this after any StackPost update that may have overwritten customized files.

### Step 1 — Pull and deploy from GitHub
```bash
cd /home/postdev/public_html
git pull origin main
bash deploy.sh
```

### Step 2 — Verify each customized file

```bash
# Facebook controller — check for pages_manage_engagement AND array fix
grep -n "pages_manage_engagement\|explode.*scopes" \
  modules/AppChannelFacebookPages/app/Http/Controllers/AppChannelFacebookPagesController.php

# Facebook options view — check for fb_comment textarea
grep -n "fb_comment" \
  modules/AppChannelFacebookPages/resources/views/options.blade.php

# Facebook Post facade — check for postComment call in handleDefault
grep -n "postComment\|handlePhotoStory\|handleVideoStory" \
  modules/AppChannelFacebookPages/app/Facades/Post.php

# Instagram Post facade — check for STORIES uppercase
grep -n "STORIES" \
  modules/AppChannelInstagramProfiles/app/Facades/Post.php
```

### Step 3 — If any check fails, re-apply the fix

```bash
# Re-apply Facebook controller
cp POST-n8n/public_html--2apr-/public_html/modules/AppChannelFacebookPages/app/Http/Controllers/AppChannelFacebookPagesController.php \
   modules/AppChannelFacebookPages/app/Http/Controllers/AppChannelFacebookPagesController.php

# Re-apply Facebook options view
cp POST-n8n/public_html--2apr-/public_html/modules/AppChannelFacebookPages/resources/views/options.blade.php \
   modules/AppChannelFacebookPages/resources/views/options.blade.php

# Re-apply Facebook Post facade
cp POST-n8n/public_html--2apr-/public_html/modules/AppChannelFacebookPages/app/Facades/Post.php \
   modules/AppChannelFacebookPages/app/Facades/Post.php

# Re-apply Instagram Post facade
cp POST-n8n/public_html--2apr-/public_html/modules/AppChannelInstagramProfiles/app/Facades/Post.php \
   modules/AppChannelInstagramProfiles/app/Facades/Post.php

# Clear caches
php artisan view:clear
php artisan config:clear
```

### Step 4 — Check for published view overrides
```bash
ls resources/views/modules/ 2>/dev/null && echo "WARNING: Published views exist — may override module source"
```

### Step 5 — Notify users to reconnect Facebook accounts
If `AppChannelFacebookPagesController.php` was re-applied, users must disconnect and reconnect their Facebook Pages to refresh their access tokens with `pages_manage_engagement`.

### Step 6 — Test
| Test | Expected Result |
|------|----------------|
| Facebook Feed post with "First comment" | Comment appears under the post; log shows `[FB Comment] Posted successfully` |
| Facebook Photo Story | Story appears on the Page |
| Facebook Video Story | Story appears on the Page |
| Instagram Story | Permalink contains `/stories/` not `/p/` |
| Facebook "First comment" field visible | Emoji picker appears in the composer dashboard |

---

## 📁 Files Modified Summary

| File (relative to live root) | Change Type | Section |
|------------------------------|-------------|--------|
| `modules/AppChannelFacebookPages/app/Http/Controllers/AppChannelFacebookPagesController.php` | Modified | §1 |
| `modules/AppChannelFacebookPages/resources/views/options.blade.php` | Modified | §2 |
| `modules/AppChannelFacebookPages/app/Facades/Post.php` | Modified | §3 |
| `modules/AppChannelInstagramProfiles/app/Facades/Post.php` | Modified | §4 |
| `deploy.sh` | New file | §5 |

---

*Last updated: 2026-04-06 — Added Instagram Story caption fix and Comment logging.*
