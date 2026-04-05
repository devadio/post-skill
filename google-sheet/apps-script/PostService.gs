/**
 * PostService.gs
 * Handles API interactions with POST.devad.io.
 * Fully aligned with the 'multi_channel.json' specification.
 */

function smartUpload(blob, token) {
  const url = "https://post.devad.io/api/public/v1/upload?api_token=" + encodeURIComponent(token);
  const options = {
    method: "post",
    headers: {
      "Accept": "application/json",
      "Authorization": "Bearer " + token,
      "X-Api-Token": token
    },
    payload: { file: blob },
    followRedirects: false,
    muteHttpExceptions: true
  };

  let lastError = "Upload failed.";
  let lastResponseCode = null;
  let lastResponseText = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    lastResponseCode = responseCode;
    lastResponseText = responseText;
    const headers = response.getAllHeaders ? response.getAllHeaders() : {};
    const locationHeader = headers.Location || headers.location || "";
    const json = parseJsonResponse_(responseText);

    if (responseCode === 201 && json.url) return json.url;

    if (responseCode === 429) {
      lastError = "Upload rate limited. Retrying...";
      Utilities.sleep(attempt * 1500);
      continue;
    }

    if (responseCode === 401 || responseCode === 403 || (responseCode >= 300 && responseCode < 400) || /do_login/i.test(responseText) || /login/i.test(String(locationHeader))) {
      throw createResponseAwareError_("Upload authentication failed. Please re-save your POST.devad.io token in the manager.", responseCode, responseText);
    }

    if (/<html/i.test(responseText)) {
      lastError = "Upload Failed (" + responseCode + "): The server returned an HTML page instead of JSON.";
    } else {
      lastError = "Upload Failed (" + responseCode + "): " + (json.message || responseText);
    }

    if (attempt < 3 && responseCode >= 500) { Utilities.sleep(attempt * 1500); continue; }
    break;
  }
  throw createResponseAwareError_(lastError, lastResponseCode, lastResponseText);
}

function parseJsonResponse_(jsonText) {
  try { return JSON.parse(jsonText); } catch (e) { return {}; }
}

function createResponseAwareError_(message, responseCode, responseText) {
  const error = new Error(message);
  if (responseCode !== undefined && responseCode !== null) error.responseCode = responseCode;
  if (responseText !== undefined && responseText !== null) { error.responseText = String(responseText); error.serverResponse = String(responseText); }
  return error;
}

function normalizeMediaType_(mediaType) {
  const value = String(mediaType || "").toLowerCase().trim();
  if (value === "carousel" || value === "carousel_manual") return "carousel";
  if (value === "video" || value === "video_manual") return "video";
  if (value === "image" || value === "photo" || value === "image_manual" || value === "photo_manual") return "image";
  if (value === "text") return "text";
  return "";
}

function isValidHttpUrl_(value) {
  if (!value) return false;
  return /^https?:\/\/\S+$/i.test(String(value).trim());
}

/**
 * Resolves the promo link mode for a platform.
 * Supports new 'promoLinkMode' and old boolean 'includeLinkInCaption' for backward compat.
 * Returns: 'caption' | 'comment' | 'none'
 */
function getPromoLinkMode_(platform) {
  if (platform.promoLinkMode) return platform.promoLinkMode;
  if (platform.includeLinkInCaption) return "caption";
  return "none";
}

/**
 * Composes caption. Promo link only appended when promoLinkMode === 'caption'.
 */
function composeCaption_(rowData, platform) {
  const caption = String(rowData.caption || "").trim();
  const safeLink = isValidHttpUrl_(rowData.promoLink) ? String(rowData.promoLink).trim() : "";
  const mode = getPromoLinkMode_(platform);
  if (mode !== "caption" || !safeLink) return caption;
  return caption ? caption + "\n\n" + safeLink : safeLink;
}

/**
 * Builds platform-specific settings.
 * When promoLinkMode === 'comment' for fb_page/ig_profile, injects fb_comment/ig_comment.
 * Story duplicates inherit these settings automatically via deep clone in sendPost().
 */
function buildPlatformSettings_(platform, rowData, mediaSpec) {
  const handle = platform.handle || "";
  const detectedType = mediaSpec.type;
  const settings = {};
  const safeTitle = String(rowData.title || "").trim();
  const safeLink = isValidHttpUrl_(rowData.promoLink) ? String(rowData.promoLink).trim() : "";
  const promoLinkMode = getPromoLinkMode_(platform);

  if (handle === "fb_page") {
    settings.post_type = detectedType;
    if (detectedType === "video") settings.fb_type = "reels";
    if (detectedType === "image" || detectedType === "text" || detectedType === "carousel") settings.fb_type = "feed";
    // Promo link as first comment (FB & IG only)
    if (promoLinkMode === "comment" && safeLink) settings.fb_comment = safeLink;
    return settings;
  }

  if (handle === "ig_profile") {
    if (detectedType === "text") return null;
    settings.post_type = detectedType;
    if (detectedType === "video") settings.ig_type = "reels";
    if (detectedType === "image") settings.ig_type = "feed";
    // Promo link as first comment
    if (promoLinkMode === "comment" && safeLink) settings.ig_comment = safeLink;
    return settings;
  }

  if (handle === "li_page" || handle === "li_profile") { settings.post_type = detectedType; return settings; }

  if (handle === "tg_channel") {
    if (detectedType === "carousel") return null;
    settings.post_type = detectedType;
    return settings;
  }

  if (handle === "tt_profile") {
    if (detectedType === "text" || detectedType === "carousel") return null;
    settings.post_type = detectedType;
    settings.privacy_level = "SELF_ONLY";
    settings.music_usage_confirmed = true;
    settings.tt_consent = 1;
    return settings;
  }

  if (handle === "yt_channel") {
    if (detectedType !== "video") return null;
    settings.post_type = "video";
    settings.title = safeTitle || String(rowData.caption || "").slice(0, 95);
    settings.youtube_title = settings.title;
    settings.category = 22;
    return settings;
  }

  if (handle === "pinterest") {
    if (detectedType !== "image") return null;
    settings.post_type = "image";
    settings.pinterest_title = safeTitle;
    settings.pinterest_board = platform.boardId || "";
    if (safeLink) settings.pinterest_link = safeLink;
    return settings;
  }

  if (handle === "gbp_loc") {
    if (detectedType === "video" || detectedType === "carousel") return null;
    settings.post_type = detectedType === "text" ? "text" : "image";
    if (safeLink) { settings.gbp_action = "LEARN_MORE"; settings.gbp_link = safeLink; }
    return settings;
  }

  if (handle === "tumblr") {
    if (detectedType === "carousel") return null;
    settings.post_type = detectedType;
    return settings;
  }

  settings.post_type = detectedType;
  return settings;
}

function shouldAddStoryDuplicate_(platform, mediaSpec) {
  if (!platform.plusStory) return false;
  if (mediaSpec.type !== "image" && mediaSpec.type !== "video") return false;
  return platform.handle === "fb_page" || platform.handle === "ig_profile";
}

/**
 * Dispatches a Multi-Channel Post.
 * Story duplicates deep-clone the base entry's settings, inheriting fb_comment/ig_comment.
 */
function sendPost(rowData, config, mediaUrls, mediaSpec) {
  const posts = [];
  const skippedPlatforms = [];

  config.platforms.forEach(p => {
    const handle = p.handle || "";
    const settings = buildPlatformSettings_(p, rowData, mediaSpec);
    if (!settings) { skippedPlatforms.push(p.name); return; }

    const baseEntry = {
      integration: { id: p.id },
      value: [{ content: composeCaption_(rowData, p) }],
      media: mediaUrls,
      settings: settings
    };
    posts.push(baseEntry);

    // Story duplicate — inherits fb_comment/ig_comment automatically via deep clone
    if (shouldAddStoryDuplicate_(p, mediaSpec)) {
      const storyEntry = JSON.parse(JSON.stringify(baseEntry));
      storyEntry.settings.post_type = "story";
      if (handle === "fb_page") storyEntry.settings.fb_type = "stories";
      if (handle === "ig_profile") storyEntry.settings.ig_type = "stories";
      posts.push(storyEntry);
    }
  });

  if (posts.length === 0) throw new Error("No compatible platforms found for this row's media type.");

  const url = "https://post.devad.io/api/public/v1/posts?api_token=" + config.token;
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ posts: posts }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const jsonText = response.getContentText();
  const json = parseJsonResponse_(jsonText);

  if (response.getResponseCode() !== 201 && response.getResponseCode() !== 202) {
    throw createResponseAwareError_("Post Failed (" + response.getResponseCode() + "): " + (json.message || jsonText), response.getResponseCode(), jsonText);
  }

  return { skippedPlatforms: skippedPlatforms, responseCode: response.getResponseCode(), serverResponse: jsonText };
}
