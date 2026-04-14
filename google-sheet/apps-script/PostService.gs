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
    payload: {
      file: blob
    },
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

    if (responseCode === 201 && json.url) {
      return json.url;
    }

    if (responseCode === 429) {
      lastError = "Upload rate limited. Retrying...";
      Utilities.sleep(attempt * 1500);
      continue;
    }

    if (responseCode === 401 || responseCode === 403 || (responseCode >= 300 && responseCode < 400) || /do_login/i.test(responseText) || /login/i.test(String(locationHeader))) {
      throw createResponseAwareError_(
        "Upload authentication failed. Please re-save your POST.devad.io token in the manager.",
        responseCode,
        responseText
      );
    }

    if (/<html/i.test(responseText)) {
      lastError = "Upload Failed (" + responseCode + "): The server returned an HTML page instead of JSON.";
    } else {
      lastError = "Upload Failed (" + responseCode + "): " + (json.message || responseText);
    }

    if (attempt < 3 && responseCode >= 500) {
      Utilities.sleep(attempt * 1500);
      continue;
    }
    break;
  }

  throw createResponseAwareError_(lastError, lastResponseCode, lastResponseText);
}

function parseJsonResponse_(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    return {};
  }
}

function createResponseAwareError_(message, responseCode, responseText) {
  const error = new Error(message);
  if (responseCode !== undefined && responseCode !== null) {
    error.responseCode = responseCode;
  }
  if (responseText !== undefined && responseText !== null) {
    error.responseText = String(responseText);
    error.serverResponse = String(responseText);
  }
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

function composeCaption_(rowData, platform) {
  const caption = String(rowData.caption || "").trim();
  const safeLink = isValidHttpUrl_(rowData.promoLink) ? String(rowData.promoLink).trim() : "";
  if (!platform.includeLinkInCaption || !safeLink) {
    return caption;
  }
  return caption ? caption + "\n\n" + safeLink : safeLink;
}

function buildPlatformSettings_(platform, rowData, mediaSpec) {
  const handle = platform.handle || "";
  const detectedType = mediaSpec.type;
  const settings = {};
  const safeTitle = String(rowData.title || "").trim();
  const safeLink = isValidHttpUrl_(rowData.promoLink) ? String(rowData.promoLink).trim() : "";

  if (handle === "fb_page") {
    settings.post_type = detectedType;
    if (detectedType === "video") settings.fb_type = "reels";
    if (detectedType === "image" || detectedType === "text" || detectedType === "carousel") settings.fb_type = "feed";
    return settings;
  }

  if (handle === "ig_profile") {
    if (detectedType === "text") {
      return null;
    }
    settings.post_type = detectedType;
    if (detectedType === "video") settings.ig_type = "reels";
    if (detectedType === "image") settings.ig_type = "feed";
    return settings;
  }

  if (handle === "li_page" || handle === "li_profile") {
    settings.post_type = detectedType;
    return settings;
  }

  if (handle === "tg_channel") {
    if (detectedType === "carousel") {
      return null;
    }
    settings.post_type = detectedType;
    return settings;
  }

  if (handle === "tt_profile") {
    if (detectedType === "text" || detectedType === "carousel") {
      return null;
    }
    settings.post_type = detectedType;
    settings.privacy_level = "SELF_ONLY";
    settings.music_usage_confirmed = true;
    settings.tt_consent = 1;
    return settings;
  }

  if (handle === "yt_channel") {
    if (detectedType !== "video") {
      return null;
    }
    settings.post_type = "video";
    settings.title = safeTitle || String(rowData.caption || "").slice(0, 95);
    settings.youtube_title = settings.title;
    settings.category = 22;
    return settings;
  }

  if (handle === "pinterest") {
    if (detectedType !== "image") {
      return null;
    }
    settings.post_type = "image";
    settings.pinterest_title = safeTitle;
    settings.pinterest_board = platform.boardId || "";
    if (safeLink) settings.pinterest_link = safeLink;
    return settings;
  }

  if (handle === "gbp_loc") {
    if (detectedType === "video" || detectedType === "carousel") {
      return null;
    }
    settings.post_type = detectedType === "text" ? "text" : "image";
    if (safeLink) {
      settings.gbp_action = "LEARN_MORE";
      settings.gbp_link = safeLink;
    }
    return settings;
  }

  if (handle === "tumblr") {
    if (detectedType === "carousel") {
      return null;
    }
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
 * Corrected to use the flat 'media' array and root-level integration IDs.
 */
function sendPost(rowData, config, mediaUrls, mediaSpec) {
  const posts = [];
  const skippedPlatforms = [];

  config.platforms.forEach(p => {
    const handle = p.handle || "";
    const settings = buildPlatformSettings_(p, rowData, mediaSpec);
    if (!settings) {
      skippedPlatforms.push(p.name);
      return;
    }

    // 1. Create Base Post Entry (Matches multi_channel.json specification)
    const baseEntry = {
      integration: { id: p.id },
      value: [{
        content: composeCaption_(rowData, p)
      }],
      media: mediaUrls, // Correct: Flat array at the post level
      settings: settings
    };
    posts.push(baseEntry);

    // 2. Optional Story Duplicate (Facebook/Instagram only)
    if (shouldAddStoryDuplicate_(p, mediaSpec)) {
      const storyEntry = JSON.parse(JSON.stringify(baseEntry));
      storyEntry.settings.post_type = "story";
      if (handle === "fb_page") {
        storyEntry.settings.fb_type = "story";
      }
      if (handle === "ig_profile") {
        storyEntry.settings.ig_type = "story";
      }
      posts.push(storyEntry);
    }
  });

  if (posts.length === 0) {
    throw new Error("No compatible platforms found for this row's media type.");
  }

  // 3. API Payload Construction
  const url = "https://post.devad.io/api/public/v1/posts?api_token=" + config.token;
  const payload = {
    posts: posts
    // Note: 'type: now' is generally the default behavior for the /posts endpoint
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const jsonText = response.getContentText();
  const json = parseJsonResponse_(jsonText);

  // The /posts endpoint returns 201 (Created) or 202 (Accepted) for multi-channel success
  if (response.getResponseCode() !== 201 && response.getResponseCode() !== 202) {
    throw createResponseAwareError_(
      "Post Failed (" + response.getResponseCode() + "): " + (json.message || jsonText),
      response.getResponseCode(),
      jsonText
    );
  }

  return {
    skippedPlatforms: skippedPlatforms,
    responseCode: response.getResponseCode(),
    serverResponse: jsonText
  };
}
