/**
 * PostService.gs
 * Handles API interactions with the current Devad CORE POST API.
 */

const POST_API_BASE_URL = "https://devad.io/api/v1/post";

function postApiHeaders_(token, idempotencyPrefix) {
  const headers = {
    "Accept": "application/json",
    "Authorization": "Bearer " + token
  };

  if (idempotencyPrefix) {
    headers["Idempotency-Key"] = idempotencyPrefix + "-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000000);
  }

  return headers;
}

function smartUpload(blob, token) {
  const url = POST_API_BASE_URL + "/media";
  const options = {
    method: "post",
    headers: postApiHeaders_(token, "post-sheet-media"),
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

    if ((responseCode === 200 || responseCode === 201) && json.media && json.media.id) {
      return json.media.id;
    }

    if (responseCode === 429) {
      lastError = "Upload rate limited. Retrying...";
      Utilities.sleep(attempt * 1500);
      continue;
    }

    if (responseCode === 401 || responseCode === 403 || (responseCode >= 300 && responseCode < 400) || /do_login/i.test(responseText) || /login/i.test(String(locationHeader))) {
      throw createResponseAwareError_(
        "Upload authentication failed. Please re-save your devad.io POST API token in the manager.",
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
  if (value === "document" || value === "doc" || value === "pdf" || value === "pdf_manual") return "document";
  if (value === "text") return "text";
  return "";
}

function isValidHttpUrl_(value) {
  if (!value) return false;
  const str = String(value).trim();
  return /^[^\s]+\.[^\s]+$/i.test(str);
}

function composeCaption_(rowData, platform) {
  const caption = String(rowData.caption || "").trim();
  let safeLink = normalizeSafeLink_(rowData.promoLink);
  const mode = getPromoLinkMode_(platform);
  if (mode !== "caption" || !safeLink) return caption;
  return caption ? caption + "\n\n" + safeLink : safeLink;
}

function normalizeSafeLink_(value) {
  let safeLink = String(value || "").trim();
  if (safeLink && isValidHttpUrl_(safeLink) && !/^https?:\/\//i.test(safeLink)) {
    safeLink = "https://" + safeLink;
  }
  return safeLink;
}

function getPromoLinkMode_(platform) {
  if (platform.promoLinkMode) return platform.promoLinkMode;
  if (platform.includeLinkInCaption) return "caption";
  return "none";
}

function providerForHandle_(handle) {
  const map = {
    fb_page: "facebook",
    ig_profile: "instagram",
    gbp_loc: "google_business",
    li_page: "linkedin",
    li_profile: "linkedin",
    pinterest: "pinterest",
    tg_channel: "telegram",
    tg_group: "telegram",
    tt_profile: "tiktok",
    tumblr: "tumblr",
    yt_channel: "youtube"
  };
  return map[handle] || handle;
}

function channelForHandle_(handle) {
  const map = {
    fb_page: "facebook_page",
    ig_profile: "instagram_business",
    gbp_loc: "google_business_profile",
    li_page: "linkedin_page",
    li_profile: "linkedin_profile",
    pinterest: "pinterest_board",
    tg_channel: "telegram_channel",
    tg_group: "telegram_group",
    tt_profile: "tiktok_profile",
    tumblr: "tumblr_blog",
    yt_channel: "youtube_channel"
  };
  return map[handle] || handle;
}

function postTypeForHandleAndType_(handle, mediaType) {
  if (handle === "gbp_loc") return "post";
  if (handle === "tg_channel" || handle === "tg_group") {
    if (mediaType === "text") return "post";
    if (mediaType === "document") return "document";
    return mediaType;
  }
  if (handle === "fb_page" && mediaType === "text") return "post";
  if (mediaType === "document") return "document";
  return mediaType === "text" ? "post" : mediaType;
}

function variantForHandleAndType_(handle, mediaType) {
  if (handle === "fb_page") {
    if (mediaType === "video") return "reel_video";
    if (mediaType === "image") return "feed_photo";
    return "feed_text";
  }
  if (handle === "ig_profile") {
    if (mediaType === "video") return "reel_video";
    return "feed_image";
  }
  if (handle === "gbp_loc") return mediaType === "image" ? "image" : "standard";
  if (handle === "pinterest") return "image_pin";
  if (handle === "tumblr") return mediaType === "image" ? "photo" : mediaType;
  if (mediaType === "document") return "document";
  return mediaType;
}

function topicIdFromRow_(rowData) {
  const raw = String(rowData.extra || "").trim();
  if (!raw) return 5;
  const match = raw.match(/(?:thread|topic|message_thread_id)?\s*[:=]?\s*(\d+)/i);
  return match ? Number(match[1]) : 5;
}

function targetHandlesFromRow_(rowData) {
  const raw = String(rowData.extra || "").trim();
  if (!raw) return null;
  const match = raw.match(/\bonly\s*=\s*([a-z0-9_,.-]+)/i);
  if (!match) return null;

  const handles = match[1]
    .split(",")
    .map(function (value) { return String(value || "").trim().toLowerCase(); })
    .filter(function (value) { return value !== ""; });

  return handles.length > 0 ? handles : null;
}

function buildPlatformSettings_(platform, rowData, mediaSpec) {
  const handle = platform.handle || "";
  const detectedType = mediaSpec.type;
  const safeTitle = String(rowData.title || "").trim();
  const safeLink = normalizeSafeLink_(rowData.promoLink);
  const promoLinkMode = getPromoLinkMode_(platform);
  const settings = {
    channel: channelForHandle_(handle),
    media_type: detectedType === "text" ? "none" : detectedType,
    post_type: postTypeForHandleAndType_(handle, detectedType),
    provider: providerForHandle_(handle),
    variant: variantForHandleAndType_(handle, detectedType)
  };
  const providerOptions = {};

  if (handle === "fb_page") {
    if (detectedType === "document") return null;
    providerOptions.post_to = detectedType === "video" ? "reels" : "feed";
    if (promoLinkMode === "comment" && safeLink) providerOptions.first_comment = safeLink;
    settings.provider_options = providerOptions;
    return settings;
  }

  if (handle === "ig_profile") {
    if (detectedType === "text" || detectedType === "document" || detectedType === "carousel") return null;
    providerOptions.post_to = detectedType === "video" ? "reels" : "feed";
    if (promoLinkMode === "comment" && safeLink) providerOptions.first_comment = safeLink;
    settings.provider_options = providerOptions;
    return settings;
  }

  if (handle === "li_page" || handle === "li_profile") {
    if (detectedType === "carousel") return null;
    return settings;
  }

  if (handle === "tg_channel" || handle === "tg_group") {
    if (detectedType === "carousel") return null;
    const topicId = topicIdFromRow_(rowData);
    if (handle === "tg_group" && topicId !== null) {
      providerOptions.message_thread_id = topicId;
      settings.provider_options = providerOptions;
    }
    return settings;
  }

  if (handle === "tt_profile") {
    if (detectedType === "text" || detectedType === "carousel" || detectedType === "document") return null;
    settings.privacy_level = "SELF_ONLY";
    settings.music_usage_confirmed = true;
    settings.tt_consent = 1;
    return settings;
  }

  if (handle === "yt_channel") {
    if (detectedType !== "video") return null;
    providerOptions.title = safeTitle || String(rowData.caption || "").slice(0, 95);
    providerOptions.category_id = "22";
    providerOptions.privacy_status = "public";
    settings.provider_options = providerOptions;
    return settings;
  }

  if (handle === "pinterest") {
    if (detectedType !== "image") return null;
    if (safeTitle) providerOptions.title = safeTitle;
    if (platform.boardId) providerOptions.board_id = platform.boardId;
    if (safeLink) providerOptions.link_url = safeLink;
    if (Object.keys(providerOptions).length > 0) settings.provider_options = providerOptions;
    return settings;
  }

  if (handle === "gbp_loc") {
    if (detectedType === "video" || detectedType === "carousel" || detectedType === "document") return null;
    providerOptions.topic_type = "STANDARD";
    if (safeLink) {
      providerOptions.call_to_action = "LEARN_MORE";
      providerOptions.button_url = safeLink;
    }
    settings.provider_options = providerOptions;
    return settings;
  }

  if (handle === "tumblr") {
    if (detectedType === "carousel" || detectedType === "document") return null;
    return settings;
  }

  return settings;
}

function shouldAddStoryDuplicate_(platform, mediaSpec) {
  if (!platform.plusStory) return false;
  if (mediaSpec.type !== "image" && mediaSpec.type !== "video") return false;
  return platform.handle === "fb_page" || platform.handle === "ig_profile";
}

function sendPost(rowData, config, mediaIds, mediaSpec) {
  const posts = [];
  const storyPosts = [];
  const skippedPlatforms = [];
  const targetHandles = targetHandlesFromRow_(rowData);

  config.platforms.forEach(p => {
    const handle = String(p.handle || "").toLowerCase();
    const channel = channelForHandle_(handle).toLowerCase();

    if (targetHandles && targetHandles.indexOf(handle) === -1 && targetHandles.indexOf(channel) === -1) {
      return;
    }

    const settings = buildPlatformSettings_(p, rowData, mediaSpec);
    if (!settings) {
      skippedPlatforms.push(p.name);
      return;
    }

    const baseEntry = {
      integration: { id: p.id },
      content: composeCaption_(rowData, p),
      status: "queued",
      media_ids: mediaIds,
      settings: settings
    };
    posts.push(baseEntry);

    if (shouldAddStoryDuplicate_(p, mediaSpec)) {
      const storyEntry = JSON.parse(JSON.stringify(baseEntry));
      storyEntry.settings.post_type = "story";
      storyEntry.settings.variant = "story_" + mediaSpec.type;
      storyEntry.settings.provider_options = { post_to: "stories" };
      storyPosts.push(storyEntry);
    }
  });

  if (posts.length === 0) {
    throw new Error("No compatible platforms found for this row's media type.");
  }

  const url = POST_API_BASE_URL + "/posts";
  const payload = {
    posts: posts,
    correlation_id: "post-sheet-" + new Date().toISOString()
  };

  const options = {
    method: "post",
    headers: postApiHeaders_(config.token, "post-sheet-posts"),
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const jsonText = response.getContentText();
  const json = parseJsonResponse_(jsonText);

  if (response.getResponseCode() !== 201 && response.getResponseCode() !== 202 && response.getResponseCode() !== 200) {
    throw createResponseAwareError_(
      "Post Failed (" + response.getResponseCode() + "): " + (json.message || jsonText),
      response.getResponseCode(),
      jsonText
    );
  }

  let finalServerResponse = jsonText;

  if (storyPosts.length > 0) {
    Utilities.sleep(1500);
    const storyResponse = UrlFetchApp.fetch(url, {
      method: "post",
      headers: postApiHeaders_(config.token, "post-sheet-story"),
      contentType: "application/json",
      payload: JSON.stringify({
        posts: storyPosts,
        correlation_id: "post-sheet-story-" + new Date().toISOString()
      }),
      muteHttpExceptions: true
    });
    const storyCode = storyResponse.getResponseCode();
    const storyText = storyResponse.getContentText();
    const storyJson = parseJsonResponse_(storyText);

    if (storyCode !== 201 && storyCode !== 202 && storyCode !== 200) {
      throw createResponseAwareError_(
        "Story Post Failed (" + storyCode + "): " + (storyJson.message || storyText),
        storyCode,
        storyText
      );
    }

    finalServerResponse += " | Story Response: " + storyText;
  }

  return {
    skippedPlatforms: skippedPlatforms,
    responseCode: response.getResponseCode(),
    serverResponse: finalServerResponse
  };
}
