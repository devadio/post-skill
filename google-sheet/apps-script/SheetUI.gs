/**
 * SheetUI.gs
 * Unified Publication Manager Backend - POST.devad.io
 *
 * promoLinkMode values:
 *   'none'    = ignore promo link from Col B
 *   'caption' = append link to caption
 *   'comment' = post link as 1st comment (FB/IG only, requires pages_manage_engagement)
 */

const POST_SHEET_NAME = "post";
const AUTOMATION_OPTIONS = {
  minute_1:  { label: "Every 1 Minute",   type: "minutes", value: 1 },
  minute_15: { label: "Every 15 Minutes", type: "minutes", value: 15 },
  minute_30: { label: "Every 30 Minutes", type: "minutes", value: 30 },
  hour_1:    { label: "Every 1 Hour",     type: "hours",   value: 1 },
  hour_6:    { label: "Every 6 Hours",    type: "hours",   value: 6 },
  hour_12:   { label: "Every 12 Hours",   type: "hours",   value: 12 },
  day_1:     { label: "Every 24 Hours",   type: "days",    value: 1 }
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🚀 POST.devad.io")
    .addItem("📱 Publication Manager", "showSidebar")
    .addItem("🤖 AI Agent Token", "showAiAgentTokenDialog")
    .addSeparator()
    .addItem("❓ Help / Support", "showHelpDialog")
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createTemplateFromFile("SettingsSidebar").evaluate().setTitle("POST.devad.io").setWidth(450);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getUnifiedData() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const triggers = ScriptApp.getProjectTriggers();
    const selectedSchedule = scriptProps.getProperty("AUTOMATION_SCHEDULE") || "hour_1";
    return {
      token: scriptProps.getProperty("POST_API_TOKEN") || "",
      platforms: getPlatformSettings(),
      triggerStatus: triggers.length > 0 ? "Active: " + (AUTOMATION_OPTIONS[selectedSchedule] || AUTOMATION_OPTIONS.hour_1).label : "Inactive",
      selectedSchedule
    };
  } catch (e) { throw new Error("Failed to load settings: " + e.message); }
}

function saveAndSync(payload) { saveUnifiedData(payload); processSheetRows(true); return true; }

function saveUnifiedData(payload) {
  validateUnifiedData_(payload);
  const scriptProps = PropertiesService.getScriptProperties();
  if (payload.token !== undefined) scriptProps.setProperty("POST_API_TOKEN", payload.token);
  const platformSettings = {};
  payload.platforms.forEach(p => {
    const promoLinkMode = p.promoLinkMode || (p.includeLinkInCaption ? "caption" : "none");
    platformSettings[p.handle] = {
      id: p.id || "", enabled: p.enabled, plusStory: p.plusStory, boardId: p.boardId || null,
      promoLinkMode, includeLinkInCaption: promoLinkMode === "caption"
    };
  });
  scriptProps.setProperty("PLATFORM_SETTINGS", JSON.stringify(platformSettings));
  return true;
}

function wipeAllData() {
  const sp = PropertiesService.getScriptProperties();
  ["POST_API_TOKEN","PLATFORM_SETTINGS","CONSECUTIVE_ERRORS","AUTOMATION_SCHEDULE"].forEach(k => sp.deleteProperty(k));
  silentlyStopTriggers();
  return true;
}

function setAutomationTrigger(minutes) { silentlyStopTriggers(); applyAutomationSchedule_(minutes); PropertiesService.getScriptProperties().setProperty("AUTOMATION_SCHEDULE", minutes); return true; }
function stopAllTriggers() { silentlyStopTriggers(); return true; }
function silentlyStopTriggers() { ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t)); }

function getPlatformSettings() {
  const savedSettings = readJsonProperty_(PropertiesService.getScriptProperties().getProperty("PLATFORM_SETTINGS"), {});
  return SUPPORTED_PLATFORMS.map(p => {
    const saved = savedSettings[p.handle] || { enabled: false, id: "", plusStory: false, boardId: null, promoLinkMode: "none", includeLinkInCaption: false };
    const promoLinkMode = saved.promoLinkMode || (saved.includeLinkInCaption ? "caption" : "none");
    return { handle: p.handle, name: p.name, help: p.help, id: saved.id || "", enabled: saved.enabled || false, plusStory: saved.plusStory || false, boardId: saved.boardId || null, promoLinkMode, includeLinkInCaption: promoLinkMode === "caption" };
  });
}

function processSheetRows(limitToOne = false) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) { console.log("Another publish run is already active."); return false; }
  try {
    const sheet = findPostSheet_(SpreadsheetApp.getActiveSpreadsheet());
    const data = sheet.getRange("A:I").getValues();
    if (data.length < 2) return;
    const config = loadAccessConfig(true);

    for (let i = 1; i < data.length; i++) {
      const rowNum = i + 1;
      if (!isQueuedStatus_(String(data[i][6] || "").trim())) continue;
      logResult(sheet, rowNum, "To do", "⏳ Initializing...");
      const rowData = { title: data[i][2], caption: data[i][3], mediaLink: data[i][4], mediaType: data[i][5], promoLink: data[i][1] };

      try {
        const mediaSpec = fetchMediaAssets(rowData.mediaLink, rowData.mediaType);
        const mediaUrls = [];
        if (mediaSpec.blobs.length > 0) {
          updateLog(sheet, rowNum, "☁️ Uploading to POST...");
          mediaSpec.blobs.forEach(blob => mediaUrls.push(smartUpload(blob, config.token)));
        } else updateLog(sheet, rowNum, "✍️ Text-only post detected...");

        updateLog(sheet, rowNum, "🚀 Dispatching Multi-Channel Post...");
        const sendResult = sendPost(rowData, config, mediaUrls, mediaSpec);
        let finalLog = "✅ Posted successfully: " + new Date().toLocaleString();
        if (sendResult.skippedPlatforms && sendResult.skippedPlatforms.length > 0) finalLog += " | Skipped: " + sendResult.skippedPlatforms.join(", ");
        if (sendResult.serverResponse) finalLog += " | Server response: " + compactResponseText_(sendResult.serverResponse);
        logResult(sheet, rowNum, "🟢 Done", finalLog);
      } catch (rowError) {
        logResult(sheet, rowNum, "🔴 Bug", rowError.message.includes("Placeholder") ? "❌ Not posted: " + new Date().toLocaleTimeString() + " (" + rowError.message + ")" : formatRowFailureLog_(rowError));
        console.error("Row Error: " + rowError.message);
      }
      if (limitToOne) break;
    }
  } catch (e) { console.error("Critical Sync Error: " + e.message); } finally { lock.releaseLock(); }
  return true;
}

function fetchMediaAssets(url, mediaType) {
  if (!url || url.toString().trim() === "") return { blobs: [], type: "text" };
  const rawUrl = url.toString().trim();
  const normalizedMediaType = (typeof normalizeMediaType_ === "function") ? normalizeMediaType_(mediaType) : String(mediaType || "").toLowerCase().trim();
  if (rawUrl.toLowerCase().includes("agent skill") || rawUrl.toLowerCase().includes("post.devad.io")) throw new Error("Placeholder row detected. Please check Column E.");
  if (!rawUrl.toLowerCase().startsWith("http") && !rawUrl.toLowerCase().startsWith("drive")) throw new Error("Invalid URL: Must start with http or drive. Check Column E.");
  if (rawUrl.includes("drive.google.com")) {
    try { const driveBlobs = processMedia(rawUrl, normalizedMediaType || mediaType || ""); return { blobs: driveBlobs, type: detectMediaType_(driveBlobs, normalizedMediaType || mediaType) }; }
    catch (e) { throw new Error("Drive Access Error: " + (e && e.message ? e.message : String(e))); }
  }
  try {
    const response = UrlFetchApp.fetch(rawUrl, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) throw new Error("Media Fetch Error: " + response.getResponseCode());
    const blob = response.getBlob();
    return { blobs: [blob], type: detectMediaType_([blob], normalizedMediaType || mediaType) };
  } catch (e) { throw new Error("Invalid Media Link: Could not reach the server."); }
}

function detectMediaType_(blobs, mediaTypeHint) {
  const normalizedHint = normalizeMediaType_(mediaTypeHint);
  if (!blobs || blobs.length === 0) return normalizedHint || "text";
  if (normalizedHint === "carousel" || blobs.length > 1) return "carousel";
  const b = blobs[0];
  const ct = String(b.getContentType ? b.getContentType() : "").toLowerCase();
  const fn = String(b.getName ? b.getName() : "").toLowerCase();
  if (ct.indexOf("video/") === 0) return "video";
  if (ct.indexOf("image/") === 0) return "image";
  if (/\.(mp4|mov|avi|mkv|webm)$/i.test(fn)) return "video";
  if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fn)) return "image";
  return normalizedHint || "image";
}

function findPostSheet_(ss) {
  return ss.getSheetByName(POST_SHEET_NAME) || ss.getSheets().find(s => s.getName().toLowerCase() === POST_SHEET_NAME) || (() => { throw new Error("Missing sheet tab named 'post'."); })();
}

function applyAutomationSchedule_(scheduleKey) {
  const schedule = AUTOMATION_OPTIONS[scheduleKey];
  if (!schedule) throw new Error("Invalid automation frequency selected.");
  let tb = ScriptApp.newTrigger("processNextQueuedRow").timeBased();
  if (schedule.type === "minutes") tb = tb.everyMinutes(schedule.value);
  else if (schedule.type === "hours") tb = tb.everyHours(schedule.value);
  else tb = tb.everyDays(schedule.value);
  tb.create();
}

function processNextQueuedRow() { return processSheetRows(true); }

function validateUnifiedData_(payload) {
  if (!payload || !payload.platforms) throw new Error("Missing sidebar payload.");
  payload.platforms.forEach(p => {
    if (p.enabled && !p.id) throw new Error(p.handle + " is enabled but missing an Integration ID.");
    if (p.handle === "pinterest" && p.enabled && !p.boardId) throw new Error("Pinterest is enabled but missing a Board ID.");
  });
}

function showHelpDialog() { SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutputFromFile("HelpDialog").setWidth(420).setHeight(360), "POST.devad.io"); }
function updateLog(sheet, rowNum, message) { sheet.getRange(rowNum, 9).setValue(message); SpreadsheetApp.flush(); }
function logResult(sheet, rowNum, status, logMsg) {
  const cell = sheet.getRange(rowNum, 7);
  sheet.getRange(rowNum, 9).setValue(logMsg);
  try { const r = cell.getDataValidation(); cell.setDataValidation(null); cell.clearNote(); cell.setValue(status); if (r) cell.setDataValidation(r); } catch(e){}
  SpreadsheetApp.flush();
}
function formatRowFailureLog_(rowError) {
  const ts = new Date().toLocaleTimeString();
  const msg = rowError && rowError.message ? rowError.message : String(rowError);
  const rc = rowError && rowError.responseCode !== undefined && rowError.responseCode !== null ? " (" + rowError.responseCode + ")" : "";
  let log = "❌ Not posted: " + ts + " | " + msg + rc;
  const sr = rowError && (rowError.serverResponse || rowError.responseText);
  if (sr) log += " | Server response: " + compactResponseText_(sr);
  return log;
}
function compactResponseText_(text) { const raw = String(text || "").trim().replace(/\s+/g, " "); return raw.length <= 900 ? raw : raw.slice(0, 900) + "…"; }
function isQueuedStatus_(status) { const n = String(status || "").trim().toLowerCase(); return n === "not yet" || n === "to do"; }
function readJsonProperty_(value, defaultVal) { try { return JSON.parse(value) || defaultVal; } catch(e) { return defaultVal; } }
