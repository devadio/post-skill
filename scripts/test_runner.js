#!/usr/bin/env node
"use strict";

/**
 * POST.devad.io test runner for Node.js 18+.
 *
 * Goals:
 * - keep secrets out of source files
 * - support dry-run validation before any live publish
 * - normalize payload settings using the lessons learned from the Sheet script
 * - provide safer HTTP error handling and optional upload support
 */

const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const API_BASE = process.env.POST_API_BASE || "https://post.devad.io/api/public/v1";
const API_TOKEN = process.env.POST_API_TOKEN || "";
const REQUEST_TIMEOUT_MS = parseIntegerEnv_("POST_API_TIMEOUT_MS", 30000);
const PINTEREST_BOARD_ID = process.env.POST_PINTEREST_BOARD_ID || "";

const TEST_MEDIA = {
  image: process.env.POST_TEST_IMAGE_URL || "https://via.placeholder.com/1080x1080.jpg",
  image2: process.env.POST_TEST_IMAGE_URL_2 || "https://via.placeholder.com/1080x1080/FF5733.jpg",
  image3: process.env.POST_TEST_IMAGE_URL_3 || "https://via.placeholder.com/1080x1080/33C1FF.jpg",
  video: process.env.POST_TEST_VIDEO_URL || "https://www.w3schools.com/html/mov_bbb.mp4",
  largeVideo: process.env.POST_TEST_LARGE_VIDEO_URL || "https://www.w3schools.com/html/mov_bbb.mp4",
};

const ACCOUNT_IDS = loadAccountIds_();

const TEST_BUILDERS = {
  facebook_text: () => createSinglePlatformPayload_("facebook", ACCOUNT_IDS.facebook, baseCaption_("facebook_text")),
  facebook_image: () => createSinglePlatformPayload_("facebook", ACCOUNT_IDS.facebook, baseCaption_("facebook_image"), { images: [TEST_MEDIA.image] }),
  facebook_carousel: () => createSinglePlatformPayload_("facebook", ACCOUNT_IDS.facebook, baseCaption_("facebook_carousel"), { images: [TEST_MEDIA.image, TEST_MEDIA.image2, TEST_MEDIA.image3] }),
  facebook_video: () => createSinglePlatformPayload_("facebook", ACCOUNT_IDS.facebook, baseCaption_("facebook_video"), { videos: [TEST_MEDIA.video] }),

  instagram_image: () => createSinglePlatformPayload_("instagram", ACCOUNT_IDS.instagram, baseCaption_("instagram_image"), { images: [TEST_MEDIA.image] }),
  instagram_carousel: () => createSinglePlatformPayload_("instagram", ACCOUNT_IDS.instagram, baseCaption_("instagram_carousel"), { images: [TEST_MEDIA.image, TEST_MEDIA.image2, TEST_MEDIA.image3] }),
  instagram_video: () => createSinglePlatformPayload_("instagram", ACCOUNT_IDS.instagram, baseCaption_("instagram_video"), { videos: [TEST_MEDIA.video] }),

  twitter_text: () => createSinglePlatformPayload_("twitter", ACCOUNT_IDS.twitter, baseCaption_("twitter_text")),
  twitter_image: () => createSinglePlatformPayload_("twitter", ACCOUNT_IDS.twitter, baseCaption_("twitter_image"), { images: [TEST_MEDIA.image] }),
  twitter_carousel: () => createSinglePlatformPayload_("twitter", ACCOUNT_IDS.twitter, baseCaption_("twitter_carousel"), { images: [TEST_MEDIA.image, TEST_MEDIA.image2, TEST_MEDIA.image3] }),

  linkedin_text: () => createSinglePlatformPayload_("linkedin", ACCOUNT_IDS.linkedin, baseCaption_("linkedin_text")),
  linkedin_image: () => createSinglePlatformPayload_("linkedin", ACCOUNT_IDS.linkedin, baseCaption_("linkedin_image"), { images: [TEST_MEDIA.image] }),
  linkedin_carousel: () => createSinglePlatformPayload_("linkedin", ACCOUNT_IDS.linkedin, baseCaption_("linkedin_carousel"), { images: [TEST_MEDIA.image, TEST_MEDIA.image2, TEST_MEDIA.image3] }),
  linkedin_video: () => createSinglePlatformPayload_("linkedin", ACCOUNT_IDS.linkedin, baseCaption_("linkedin_video"), { videos: [TEST_MEDIA.video] }),

  tiktok_image: () => createSinglePlatformPayload_("tiktok", ACCOUNT_IDS.tiktok, baseCaption_("tiktok_image"), { images: [TEST_MEDIA.image] }),
  tiktok_video: () => createSinglePlatformPayload_("tiktok", ACCOUNT_IDS.tiktok, baseCaption_("tiktok_video"), { videos: [TEST_MEDIA.video] }),
  tiktok_large_video: () => createSinglePlatformPayload_("tiktok", ACCOUNT_IDS.tiktok, baseCaption_("tiktok_large_video"), { videos: [TEST_MEDIA.largeVideo] }),

  youtube_video: () => createSinglePlatformPayload_("youtube", ACCOUNT_IDS.youtube, baseCaption_("youtube_video"), { videos: [TEST_MEDIA.video] }),
  pinterest_image: () => createSinglePlatformPayload_("pinterest", ACCOUNT_IDS.pinterest, baseCaption_("pinterest_image"), { images: [TEST_MEDIA.image] }),

  telegram_text: () => createSinglePlatformPayload_("telegram", ACCOUNT_IDS.telegram, baseCaption_("telegram_text")),
  telegram_image: () => createSinglePlatformPayload_("telegram", ACCOUNT_IDS.telegram, baseCaption_("telegram_image"), { images: [TEST_MEDIA.image] }),
  telegram_video: () => createSinglePlatformPayload_("telegram", ACCOUNT_IDS.telegram, baseCaption_("telegram_video"), { videos: [TEST_MEDIA.video] }),

  google_image: () => createSinglePlatformPayload_("google_business", ACCOUNT_IDS.google_business, baseCaption_("google_image"), { images: [TEST_MEDIA.image] }),
};

async function main() {
  const { command, args, options } = parseCli_(process.argv.slice(2));

  if (!command || command === "help" || options.help) {
    printUsage_();
    return;
  }

  if (command === "list-tests") {
    console.log(Object.keys(TEST_BUILDERS).sort().join("\n"));
    return;
  }

  if (command === "health") {
    const result = await apiRequestJson_("GET", "/health");
    printResponse_("health", result);
    return;
  }

  if (command === "accounts") {
    assertTokenPresent_("accounts");
    const result = await apiRequestJson_("GET", "/accounts");
    printResponse_("accounts", result);
    return;
  }

  if (command === "upload") {
    const source = args[0];
    if (!source) {
      throw new Error("Missing upload source. Use: node test_runner.js upload <path-or-url>");
    }
    if (!options.dryRun) {
      assertTokenPresent_("upload");
    }
    const uploadedUrl = await uploadSource_(source, options.dryRun);
    console.log(uploadedUrl);
    return;
  }

  const payload = buildPayloadForCommand_(command);
  validatePayload_(payload);

  if (options.printPayload || options.dryRun) {
    console.log(JSON.stringify(payload, null, 2));
  }

  if (options.dryRun) {
    console.log("\nDry run passed. No live request was sent.");
    return;
  }

  assertTokenPresent_(command);
  const result = await apiRequestJson_("POST", "/posts", payload);
  printResponse_(command, result);
}

function parseCli_(argv) {
  const options = { dryRun: false, printPayload: false, help: false };
  const positional = [];

  argv.forEach(arg => {
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--print-payload") {
      options.printPayload = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      positional.push(arg);
    }
  });

  return {
    command: positional[0] || "",
    args: positional.slice(1),
    options,
  };
}

function printUsage_() {
  console.log([
    "Usage:",
    "  node scripts/test_runner.js list-tests",
    "  node scripts/test_runner.js accounts",
    "  node scripts/test_runner.js health",
    "  node scripts/test_runner.js facebook_image --dry-run --print-payload",
    "  node scripts/test_runner.js upload <path-or-url>",
    "",
    "Required env for live requests:",
    "  POST_API_TOKEN",
    "",
    "Optional env:",
    "  POST_API_BASE",
    "  POST_ACCOUNT_IDS_JSON",
    "  POST_ACCOUNT_FACEBOOK",
    "  POST_ACCOUNT_INSTAGRAM",
    "  POST_ACCOUNT_TWITTER",
    "  POST_ACCOUNT_LINKEDIN",
    "  POST_ACCOUNT_TIKTOK",
    "  POST_ACCOUNT_YOUTUBE",
    "  POST_ACCOUNT_PINTEREST",
    "  POST_ACCOUNT_TELEGRAM",
    "  POST_ACCOUNT_TUMBLR",
    "  POST_ACCOUNT_GOOGLE_BUSINESS",
    "  POST_PINTEREST_BOARD_ID",
  ].join("\n"));
}

function parseIntegerEnv_(name, fallbackValue) {
  const rawValue = process.env[name];
  const parsed = Number.parseInt(rawValue || "", 10);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function loadAccountIds_() {
  const defaults = {
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    tiktok: "",
    youtube: "",
    pinterest: "",
    telegram: "",
    tumblr: "",
    google_business: "",
  };

  const envMap = {
    facebook: process.env.POST_ACCOUNT_FACEBOOK || "",
    instagram: process.env.POST_ACCOUNT_INSTAGRAM || "",
    twitter: process.env.POST_ACCOUNT_TWITTER || "",
    linkedin: process.env.POST_ACCOUNT_LINKEDIN || "",
    tiktok: process.env.POST_ACCOUNT_TIKTOK || "",
    youtube: process.env.POST_ACCOUNT_YOUTUBE || "",
    pinterest: process.env.POST_ACCOUNT_PINTEREST || "",
    telegram: process.env.POST_ACCOUNT_TELEGRAM || "",
    tumblr: process.env.POST_ACCOUNT_TUMBLR || "",
    google_business: process.env.POST_ACCOUNT_GOOGLE_BUSINESS || "",
  };

  let jsonMap = {};
  if (process.env.POST_ACCOUNT_IDS_JSON) {
    try {
      jsonMap = JSON.parse(process.env.POST_ACCOUNT_IDS_JSON);
    } catch (error) {
      throw new Error("POST_ACCOUNT_IDS_JSON is not valid JSON.");
    }
  }

  return { ...defaults, ...jsonMap, ...envMap };
}

function baseCaption_(testName) {
  return "POST API test - " + testName + ". #devadio #test";
}

function buildPayloadForCommand_(command) {
  const builder = TEST_BUILDERS[command];
  if (!builder) {
    throw new Error("Unknown command or test '" + command + "'. Run list-tests to see supported tests.");
  }
  return builder();
}

function createSinglePlatformPayload_(providerKey, integrationId, content, mediaSpec = {}) {
  const post = createPostEntry_(providerKey, integrationId, content, mediaSpec);
  return { posts: [post], type: "now" };
}

function createPostEntry_(providerKey, integrationId, content, mediaSpec = {}) {
  const normalizedMedia = normalizeMediaSpec_(mediaSpec);
  const detectedType = detectMediaType_(normalizedMedia);
  const valueEntry = { content };

  if (normalizedMedia.images.length > 0) {
    valueEntry.image = normalizedMedia.images;
  }
  if (normalizedMedia.videos.length > 0) {
    valueEntry.video = normalizedMedia.videos;
  }

  const settings = buildPlatformSettings_(providerKey, detectedType, content);
  const entry = {
    integration: { id: integrationId || "" },
    value: [valueEntry],
  };

  if (Object.keys(settings).length > 0) {
    entry.settings = settings;
  }
  return entry;
}

function normalizeMediaSpec_(mediaSpec) {
  return {
    images: Array.isArray(mediaSpec.images) ? mediaSpec.images.filter(Boolean) : [],
    videos: Array.isArray(mediaSpec.videos) ? mediaSpec.videos.filter(Boolean) : [],
  };
}

function detectMediaType_(mediaSpec) {
  if (mediaSpec.videos.length > 0 && mediaSpec.images.length > 0) {
    throw new Error("Mixed image and video payloads are not supported in the test runner.");
  }
  if (mediaSpec.videos.length > 1) {
    throw new Error("Only one video is supported per test payload.");
  }
  if (mediaSpec.videos.length === 1) return "video";
  if (mediaSpec.images.length > 1) return "carousel";
  if (mediaSpec.images.length === 1) return "image";
  return "text";
}

function buildPlatformSettings_(providerKey, detectedType, content) {
  const title = String(content || "").slice(0, 95) || "POST API Test";
  const settings = {};

  if (providerKey === "facebook") {
    settings.post_type = detectedType;
    settings.fb_type = detectedType === "video" ? "reels" : "feed";
    return settings;
  }

  if (providerKey === "instagram") {
    settings.post_type = detectedType;
    if (detectedType === "video") settings.ig_type = "reels";
    if (detectedType === "image") settings.ig_type = "feed";
    return settings;
  }

  if (providerKey === "linkedin" || providerKey === "twitter" || providerKey === "telegram" || providerKey === "tumblr") {
    settings.post_type = detectedType;
    return settings;
  }

  if (providerKey === "tiktok") {
    settings.post_type = detectedType;
    settings.privacy_level = "SELF_ONLY";
    settings.music_usage_confirmed = true;
    settings.tt_consent = 1;
    settings.duet = false;
    settings.stitch = false;
    settings.comment = false;
    return settings;
  }

  if (providerKey === "youtube") {
    settings.post_type = "video";
    settings.title = title;
    settings.youtube_title = title;
    settings.type = "unlisted";
    settings.category = 22;
    return settings;
  }

  if (providerKey === "pinterest") {
    settings.post_type = "image";
    settings.pinterest_title = title;
    settings.pinterest_board = PINTEREST_BOARD_ID;
    return settings;
  }

  if (providerKey === "google_business") {
    settings.post_type = detectedType === "text" ? "text" : "image";
    return settings;
  }

  return settings;
}

function validatePayload_(payload) {
  if (!payload || !Array.isArray(payload.posts) || payload.posts.length === 0) {
    throw new Error("Payload must include a non-empty posts array.");
  }

  payload.posts.forEach((post, index) => {
    const label = "posts[" + index + "]";
    const integrationId = post && post.integration ? String(post.integration.id || "").trim() : "";
    if (!integrationId || integrationId === "FILL_ME") {
      throw new Error(label + " is missing a valid integration ID.");
    }

    const firstValue = Array.isArray(post.value) ? post.value[0] : null;
    if (!firstValue) {
      throw new Error(label + " must include value[0].");
    }

    const imageCount = Array.isArray(firstValue.image) ? firstValue.image.length : 0;
    const videoCount = Array.isArray(firstValue.video) ? firstValue.video.length : 0;
    const detectedType = detectMediaType_({
      images: Array.isArray(firstValue.image) ? firstValue.image : [],
      videos: Array.isArray(firstValue.video) ? firstValue.video : [],
    });
    const settings = post.settings || {};
    const isPinterestPayload = Object.prototype.hasOwnProperty.call(settings, "pinterest_title");

    if (videoCount > 1) {
      throw new Error(label + " cannot contain more than one video.");
    }
    if (isPinterestPayload && !String(settings.pinterest_board || "").trim()) {
      throw new Error(label + " is missing POST_PINTEREST_BOARD_ID.");
    }
    if (settings.ig_type === "reel") {
      throw new Error(label + " uses ig_type=reel. Use ig_type=reels with post_type=video.");
    }
    if (settings.post_type === "reel") {
      throw new Error(label + " uses post_type=reel. Use post_type=video plus ig_type=reels.");
    }
    if (settings.post_type === "story" && detectedType === "carousel") {
      throw new Error(label + " cannot create a story from carousel media.");
    }
    if (imageCount > 1 && settings.ig_type) {
      throw new Error(label + " should not set ig_type on carousel payloads.");
    }
    if (settings.post_type === "video" && detectedType !== "video" && detectedType !== "text") {
      throw new Error(label + " declares post_type=video but the media is not a single video.");
    }
  });
}

function assertTokenPresent_(commandName) {
  if (!API_TOKEN) {
    throw new Error("POST_API_TOKEN is required for '" + commandName + "'.");
  }
}

async function apiRequestJson_(method, pathName, body = null) {
  const response = await apiRequestRaw_(method, pathName, body);
  return {
    code: response.code,
    body: response.json !== null ? response.json : response.text,
    rawText: response.text,
  };
}

async function apiRequestRaw_(method, pathName, body = null, extraOptions = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = buildApiUrl_(pathName);
    const headers = {
      Accept: "application/json",
      ...(extraOptions.headers || {}),
    };
    if (API_TOKEN) {
      headers.Authorization = "Bearer " + API_TOKEN;
      headers["X-Api-Token"] = API_TOKEN;
    }
    const options = {
      method,
      headers,
      redirect: "manual",
      signal: controller.signal,
      ...extraOptions,
    };

    if (body !== null && body !== undefined && !options.body) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const text = await response.text();
    const json = tryParseJson_(text);
    const locationHeader = response.headers.get("location") || "";

    if (response.status === 401 || response.status === 403 || /login/i.test(locationHeader) || /do_login/i.test(text)) {
      throw createResponseAwareError_("Authentication failed. Check POST_API_TOKEN.", response.status, text);
    }

    if (!response.ok) {
      const message = /<html/i.test(text)
        ? "Server returned HTML instead of JSON."
        : (json && json.message) || text || ("HTTP " + response.status);
      throw createResponseAwareError_("Request failed: " + message, response.status, text);
    }

    return { code: response.status, text, json };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out after " + REQUEST_TIMEOUT_MS + "ms.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildApiUrl_(pathName) {
  const separator = pathName.includes("?") ? "&" : "?";
  return API_BASE + pathName + (API_TOKEN ? separator + "api_token=" + encodeURIComponent(API_TOKEN) : "");
}

function tryParseJson_(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function createResponseAwareError_(message, responseCode, responseText) {
  const error = new Error(message);
  error.responseCode = responseCode;
  error.responseText = responseText;
  return error;
}

function printResponse_(label, result) {
  console.log(label + " -> HTTP " + result.code);
  console.log(JSON.stringify(result.body, null, 2));
}

async function uploadSource_(source, dryRun) {
  const uploadFile = await readUploadSource_(source);

  if (dryRun) {
    return JSON.stringify({
      dryRun: true,
      fileName: uploadFile.fileName,
      contentType: uploadFile.contentType,
      size: uploadFile.data.length,
    }, null, 2);
  }

  const form = new FormData();
  const blob = new Blob([uploadFile.data], { type: uploadFile.contentType });
  form.append("file", blob, uploadFile.fileName);

  const response = await apiRequestRaw_("POST", "/upload", null, { body: form });
  const json = response.json || {};
  if (!json.url) {
    throw createResponseAwareError_("Upload succeeded but no URL was returned.", response.code, response.text);
  }
  return json.url;
}

async function readUploadSource_(source) {
  if (/^https?:\/\//i.test(source)) {
    const remoteResponse = await fetch(source);
    if (!remoteResponse.ok) {
      throw new Error("Could not download upload source: HTTP " + remoteResponse.status);
    }
    const arrayBuffer = await remoteResponse.arrayBuffer();
    return {
      data: Buffer.from(arrayBuffer),
      fileName: guessFileNameFromUrl_(source),
      contentType: remoteResponse.headers.get("content-type") || guessMimeType_(source),
    };
  }

  const absolutePath = path.resolve(source);
  if (!fs.existsSync(absolutePath)) {
    throw new Error("Upload source not found: " + absolutePath);
  }
  return {
    data: fs.readFileSync(absolutePath),
    fileName: path.basename(absolutePath),
    contentType: guessMimeType_(absolutePath),
  };
}

function guessFileNameFromUrl_(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const fileName = path.basename(parsed.pathname);
    return fileName || "upload.bin";
  } catch (error) {
    return "upload.bin";
  }
}

function guessMimeType_(fileName) {
  const lowered = String(fileName || "").toLowerCase();
  if (lowered.endsWith(".png")) return "image/png";
  if (lowered.endsWith(".jpg") || lowered.endsWith(".jpeg")) return "image/jpeg";
  if (lowered.endsWith(".webp")) return "image/webp";
  if (lowered.endsWith(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

main().catch(error => {
  console.error("Error:", error.message);
  if (error.responseCode !== undefined) {
    console.error("HTTP:", error.responseCode);
  }
  if (error.responseText) {
    console.error("Server response:", error.responseText);
  }
  process.exit(1);
});
