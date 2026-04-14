/**
 * SheetUI.gs
 * Unified Publication Manager Backend - POST.devad.io
 */

const POST_SHEET_NAME = "post";
const AUTOMATION_OPTIONS = {
  minute_1: { label: "Every 1 Minute", type: "minutes", value: 1 },
  minute_15: { label: "Every 15 Minutes", type: "minutes", value: 15 },
  minute_30: { label: "Every 30 Minutes", type: "minutes", value: 30 },
  hour_1: { label: "Every 1 Hour", type: "hours", value: 1 },
  hour_6: { label: "Every 6 Hours", type: "hours", value: 6 },
  hour_12: { label: "Every 12 Hours", type: "hours", value: 12 },
  day_1: { label: "Every 24 Hours", type: "days", value: 1 }
};

/**
 * 🎨 Definitive Menu Setup
 * This is the primary onOpen function for the active project.
 * It strictly creates the POST.devad.io menu to avoid collisions.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🚀 POST.devad.io")
    .addItem("📱 Publication Manager", "showSidebar")
    .addItem("🤖 AI Agent Token", "showAiAgentTokenDialog")
    .addSeparator()
    .addItem("❓ Help / Support", "showHelpDialog")
    .addToUi();
}

/**
 * 📱 Sidebar Controller: Opens the Unified Publication Manager
 */
function showSidebar() {
  const html = HtmlService.createTemplateFromFile("SettingsSidebar").evaluate()
    .setTitle("POST.devad.io")
    .setWidth(450);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * 🔄 Data Fetcher: Returns all information for the sidebar UI
 */
function getUnifiedData() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const token = scriptProps.getProperty("POST_API_TOKEN") || "";
    const platforms = getPlatformSettings();
    const selectedSchedule = scriptProps.getProperty("AUTOMATION_SCHEDULE") || "hour_1";
    const triggers = ScriptApp.getProjectTriggers();
    const status = (triggers.length > 0)
      ? "Active: " + (AUTOMATION_OPTIONS[selectedSchedule] || AUTOMATION_OPTIONS.hour_1).label
      : "Inactive";

    return {
      token: token,
      platforms: platforms,
      triggerStatus: status,
      selectedSchedule: selectedSchedule
    };
  } catch (e) {
    throw new Error("Failed to load settings: " + e.message);
  }
}

/**
 * 💾 One-Click Action: Saves all settings and immediately runs a Sync
 */
function saveAndSync(payload) {
  saveUnifiedData(payload);
  processSheetRows(true); // Limit to one by default for manual trigger
  return true;
}

/**
 * 💾 Global Saver: Persists all changes from the sidebar
 */
function saveUnifiedData(payload) {
  validateUnifiedData_(payload);
  const scriptProps = PropertiesService.getScriptProperties();
  if (payload.token !== undefined) {
    scriptProps.setProperty("POST_API_TOKEN", payload.token);
  }

  const platformSettings = {};
  payload.platforms.forEach(p => {
    // Store Toggle, ID, plusStory, and BoardID using Registry Handle
    platformSettings[p.handle] = {
      id: p.id || "",
      enabled: p.enabled,
      plusStory: p.plusStory,
      boardId: p.boardId || null,
      includeLinkInCaption: p.includeLinkInCaption || false
    };
  });

  scriptProps.setProperty("PLATFORM_SETTINGS", JSON.stringify(platformSettings));
  return true;
}

/**
 * 🧹 System Reset: Wipes all personal settings
 */
function wipeAllData() {
  const scriptProps = PropertiesService.getScriptProperties();
  scriptProps.deleteProperty("POST_API_TOKEN");
  scriptProps.deleteProperty("PLATFORM_SETTINGS");
  scriptProps.deleteProperty("CONSECUTIVE_ERRORS");
  scriptProps.deleteProperty("AUTOMATION_SCHEDULE");
  
  silentlyStopTriggers();
  return true;
}

/**
 * ⏲️ Automation: Trigger Management
 */
function setAutomationTrigger(minutes) {
  silentlyStopTriggers();
  applyAutomationSchedule_(minutes);
  PropertiesService.getScriptProperties().setProperty("AUTOMATION_SCHEDULE", minutes);
  return true;
}

function stopAllTriggers() {
  silentlyStopTriggers();
  return true;
}

function silentlyStopTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
}

/**
 * ⚙️ Config Fetcher (Sidebar helper)
 * Merges the Static Registry with the User's Saved Settings
 */
function getPlatformSettings() {
  const scriptProps = PropertiesService.getScriptProperties();
  const savedSettings = readJsonProperty_(scriptProps.getProperty("PLATFORM_SETTINGS"), {});
  
  // SUPPORTED_PLATFORMS is defined in ConfigService.gs
  return SUPPORTED_PLATFORMS.map(p => {
    const saved = savedSettings[p.handle] || { enabled: false, id: "", plusStory: false, boardId: null, includeLinkInCaption: false };
    return {
      handle: p.handle,
      name: p.name,
      help: p.help,
      id: saved.id || "",
      enabled: saved.enabled || false,
      plusStory: saved.plusStory || false,
      boardId: saved.boardId || null,
      includeLinkInCaption: saved.includeLinkInCaption || false
    };
  });
}

/**
 * 🚀 Core Processing Logic with Multi-Channel Payloads
 */
function processSheetRows(limitToOne = false) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    console.log("Another publish run is already active. Skipping this run.");
    return false;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = findPostSheet_(ss);

    const data = sheet.getRange("A:I").getValues();
    if (data.length < 2) return;
    const headers = data[0];
    console.log("Sheet Headers identified: " + JSON.stringify(headers));

    const config = loadAccessConfig(true); 

    for (let i = 1; i < data.length; i++) {
      const rowNum = i + 1;
      const status = String(data[i][6] || "").trim(); // Column G
      if (!isQueuedStatus_(status)) continue;

      logResult(sheet, rowNum, "To do", "⏳ Initializing...");

      const rowData = {
        title: data[i][2],      // Column C
        caption: data[i][3],    // Column D
        mediaLink: data[i][4],  // Column E
        mediaType: data[i][5],  // Column F
        promoLink: data[i][1]   // Column B
      };

      try {
        const mediaSpec = fetchMediaAssets(rowData.mediaLink, rowData.mediaType);
        const mediaBlobs = mediaSpec.blobs;
        const mediaUrls = [];

        if (mediaBlobs.length > 0) {
          updateLog(sheet, rowNum, "☁️ Uploading to POST...");
          mediaBlobs.forEach(blob => {
            mediaUrls.push(smartUpload(blob, config.token));
          });
        } else {
          updateLog(sheet, rowNum, "✍️ Text-only post detected...");
        }
        
        updateLog(sheet, rowNum, "🚀 Dispatching Multi-Channel Post...");
        const sendResult = sendPost(rowData, config, mediaUrls, mediaSpec);

        let finalLog = "✅ Posted successfully: " + new Date().toLocaleString();
        if (sendResult.skippedPlatforms && sendResult.skippedPlatforms.length > 0) {
          finalLog += " | Skipped: " + sendResult.skippedPlatforms.join(", ");
        }
        if (sendResult.serverResponse) {
          finalLog += " | Server response: " + compactResponseText_(sendResult.serverResponse);
        }
        logResult(sheet, rowNum, "🟢 Done", finalLog);
        
      } catch (rowError) {
        // Special Handling for Template/Placeholder Rows
        if (rowError.message.includes("Placeholder")) {
          logResult(sheet, rowNum, "🔴 Bug", "❌ Not posted: " + new Date().toLocaleTimeString() + " (" + rowError.message + ")");
        } else {
          logResult(sheet, rowNum, "🔴 Bug", formatRowFailureLog_(rowError));
        }
        console.error("Row Error: " + rowError.message);
      }
      
      if (limitToOne) break; 
    }
  } catch (e) {
    console.error("Critical Sync Error: " + e.message);
  } finally {
    lock.releaseLock();
  }

  return true;
}

/**
 * 📦 Smart Fetcher: Handles Google Drive links and direct web URLs
 * Returns blob list plus detected media type.
 */
function fetchMediaAssets(url, mediaType) {
  if (!url || url.toString().trim() === "") {
    return { blobs: [], type: "text" }; // Support Text-Only posts
  }
  
  const rawUrl = url.toString().trim();
  const normalizedMediaType = (typeof normalizeMediaType_ === "function")
    ? normalizeMediaType_(mediaType)
    : String(mediaType || "").toLowerCase().trim();
  
  // 🛡️ Filter common template placeholders
  if (rawUrl.toLowerCase().includes("agent skill") || rawUrl.toLowerCase().includes("post.devad.io")) {
    throw new Error("Placeholder row detected. Please check Column E.");
  }

  if (!rawUrl.toLowerCase().startsWith("http") && !rawUrl.toLowerCase().startsWith("drive")) {
    throw new Error("Invalid URL: Must start with http or drive. Check Column E.");
  }

  if (rawUrl.includes("drive.google.com")) {
    try {
      const driveBlobs = processMedia(rawUrl, normalizedMediaType || mediaType || "");
      return {
        blobs: driveBlobs,
        type: detectMediaType_(driveBlobs, normalizedMediaType || mediaType)
      };
    } catch (e) {
      throw new Error("Drive Access Error: " + (e && e.message ? e.message : String(e)));
    }
  }

  try {
    const response = UrlFetchApp.fetch(rawUrl, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      throw new Error("Media Fetch Error: " + response.getResponseCode());
    }
    const blob = response.getBlob();
    return {
      blobs: [blob],
      type: detectMediaType_([blob], normalizedMediaType || mediaType)
    };
  } catch (e) {
    throw new Error("Invalid Media Link: Could not reach the server.");
  }
}

function detectMediaType_(blobs, mediaTypeHint) {
  const normalizedHint = normalizeMediaType_(mediaTypeHint);
  if (!blobs || blobs.length === 0) {
    return normalizedHint || "text";
  }

  if (normalizedHint === "carousel" || blobs.length > 1) {
    return "carousel";
  }

  const firstBlob = blobs[0];
  const contentType = String(firstBlob.getContentType ? firstBlob.getContentType() : "").toLowerCase();
  const fileName = String(firstBlob.getName ? firstBlob.getName() : "").toLowerCase();

  if (contentType.indexOf("video/") === 0) return "video";
  if (contentType.indexOf("image/") === 0) return "image";
  if (/\.(mp4|mov|avi|mkv|webm)$/i.test(fileName)) return "video";
  if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName)) return "image";

  return normalizedHint || "image";
}

function findPostSheet_(ss) {
  const directMatch = ss.getSheetByName(POST_SHEET_NAME);
  if (directMatch) {
    return directMatch;
  }

  const fallback = ss.getSheets().filter(sheet => sheet.getName().toLowerCase() === POST_SHEET_NAME)[0];
  if (fallback) {
    return fallback;
  }

  throw new Error("Missing sheet tab named 'post'. Create that tab before running automation.");
}

function applyAutomationSchedule_(scheduleKey) {
  const schedule = AUTOMATION_OPTIONS[scheduleKey];
  if (!schedule) {
    throw new Error("Invalid automation frequency selected.");
  }

  let triggerBuilder = ScriptApp.newTrigger("processNextQueuedRow").timeBased();
  if (schedule.type === "minutes") {
    triggerBuilder = triggerBuilder.everyMinutes(schedule.value);
  } else if (schedule.type === "hours") {
    triggerBuilder = triggerBuilder.everyHours(schedule.value);
  } else {
    triggerBuilder = triggerBuilder.everyDays(schedule.value);
  }
  triggerBuilder.create();
}

function processNextQueuedRow() {
  return processSheetRows(true);
}

function validateUnifiedData_(payload) {
  if (!payload || !payload.platforms) {
    throw new Error("Missing sidebar payload.");
  }

  payload.platforms.forEach(platform => {
    if (platform.enabled && !platform.id) {
      throw new Error(platform.handle + " is enabled but missing an Integration ID.");
    }
    if (platform.handle === "pinterest" && platform.enabled && !platform.boardId) {
      throw new Error("Pinterest is enabled but missing a Board ID.");
    }
  });
}

/**
 * ❓ Help Logic
 */
function showHelpDialog() {
  const html = HtmlService.createHtmlOutputFromFile("HelpDialog")
    .setWidth(420)
    .setHeight(360);
  SpreadsheetApp.getUi().showModalDialog(html, "POST.devad.io");
}

/**
 * 🪵 Utility Loggers
 */
function updateLog(sheet, rowNum, message) {
  sheet.getRange(rowNum, 9).setValue(message);
  SpreadsheetApp.flush();
}

function logResult(sheet, rowNum, status, logMsg) {
  const cell = sheet.getRange(rowNum, 7);
  sheet.getRange(rowNum, 9).setValue(logMsg);

  try {
    const originalRule = cell.getDataValidation();
    cell.setDataValidation(null);
    cell.clearNote();
    cell.setValue(status);
    if (originalRule) cell.setDataValidation(originalRule);
  } catch (e) {}
  SpreadsheetApp.flush();
}

function formatRowFailureLog_(rowError) {
  const timeStamp = new Date().toLocaleTimeString();
  const errorMessage = rowError && rowError.message ? rowError.message : String(rowError);
  const responseCode = rowError && rowError.responseCode !== undefined && rowError.responseCode !== null
    ? " (" + rowError.responseCode + ")"
    : "";
  let logLine = "❌ Not posted: " + timeStamp + " | " + errorMessage + responseCode;
  const serverResponse = rowError && (rowError.serverResponse || rowError.responseText);
  if (serverResponse) {
    logLine += " | Server response: " + compactResponseText_(serverResponse);
  }
  return logLine;
}

function compactResponseText_(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const normalized = raw.replace(/\s+/g, " ");
  if (normalized.length <= 900) {
    return normalized;
  }
  return normalized.slice(0, 900) + "…";
}

function isQueuedStatus_(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized === "not yet" || normalized === "to do";
}



