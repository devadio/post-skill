/**
 * WebAppApi.gs
 * Lightweight Google Sheets JSON API for AI agents.
 *
 * Read access is open.
 * Write access is limited to specific columns and protected by a shared token.
 */

const WEBAPP_TOKEN_PROPERTY = "AI_AGENT_TOKEN";
const WEBAPP_TARGET_SHEET_NAME = "post";
const WEBAPP_ALLOWED_COLUMN_NAMES = [
  "Reference",
  "Promotional link",
  "Title",
  "Social media summary (caption)",
  "Creative link",
  "Creative type",
  "Action?",
  "Check",
  "log"
];
const WEBAPP_ALLOWED_RANGE_A1 = "A:I";

function doGet(e) {
  try {
    const sheet = getWebAppTargetSheet_(e);
    const data = sheet.getRange(WEBAPP_ALLOWED_RANGE_A1).getValues();
    if (!data.length || !data[0].length) {
      return createJsonOutput_({ message: "Sheet is empty" });
    }

    const headers = data[0];
    const rows = data.slice(1);
    const jsonArray = rows.map(function(row, rowIndex) {
      const record = { "__rowNumber": rowIndex + 2 };
      headers.forEach(function(header, index) {
        record[String(header || "").trim() || ("Column" + (index + 1))] = row[index];
      });
      return record;
    });

    return createJsonOutput_(jsonArray);
  } catch (error) {
    return createJsonOutput_({ success: false, error: error.message });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonOutput_({ success: false, error: "Missing JSON body." });
    }

    const body = JSON.parse(e.postData.contents);
    if (body.token !== getAiAgentToken_()) {
      return createJsonOutput_({ success: false, error: "Unauthorized: Invalid or missing token." });
    }

    const rowNumber = Number(body.rowNumber);
    const columnName = normalizeColumnName_(body.column);
    const newValue = body.value;

    if (!WEBAPP_ALLOWED_COLUMN_NAMES.includes(columnName)) {
      return createJsonOutput_({ success: false, error: "Forbidden: Editing the '" + columnName + "' column is not allowed." });
    }
    if (!Number.isInteger(rowNumber) || rowNumber < 2) {
      return createJsonOutput_({ success: false, error: "Invalid rowNumber. Header row cannot be edited." });
    }

    const sheet = getWebAppTargetSheet_({ parameter: body });
    const headers = sheet.getRange(1, 1, 1, 9).getValues()[0].map(normalizeColumnName_);
    const colIndex = headers.indexOf(columnName) + 1;
    if (colIndex === 0) {
      return createJsonOutput_({ success: false, error: "Column not found." });
    }
    if (colIndex < 1 || colIndex > 9) {
      return createJsonOutput_({ success: false, error: "Column outside allowed range A:I." });
    }
    if (rowNumber > sheet.getLastRow()) {
      return createJsonOutput_({ success: false, error: "Row not found." });
    }

    sheet.getRange(rowNumber, colIndex).setValue(newValue);
    return createJsonOutput_({
      success: true,
      message: "Row " + rowNumber + ", Column '" + columnName + "' updated successfully."
    });
  } catch (error) {
    return createJsonOutput_({ success: false, error: error.message });
  }
}

function getWebAppTargetSheet_(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const requestedName = e && e.parameter && e.parameter.sheet
    ? String(e.parameter.sheet).trim()
    : "";

  if (requestedName && requestedName !== WEBAPP_TARGET_SHEET_NAME) {
    throw new Error("Only the '" + WEBAPP_TARGET_SHEET_NAME + "' tab is supported.");
  }

  const postSheet = ss.getSheetByName(WEBAPP_TARGET_SHEET_NAME);
  if (postSheet) {
    return postSheet;
  }

  throw new Error("Sheet not found: " + WEBAPP_TARGET_SHEET_NAME);
}

function createJsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function showAiAgentTokenDialog() {
  const html = HtmlService.createTemplateFromFile("AiAgentTokenDialog")
    .evaluate()
    .setTitle("AI Agent Token")
    .setWidth(420)
    .setHeight(360);
  SpreadsheetApp.getUi().showModalDialog(html, "AI Agent Token");
}

function getAiAgentTokenInfo() {
  return {
    token: getAiAgentToken_(),
    sheetName: WEBAPP_TARGET_SHEET_NAME,
    range: WEBAPP_ALLOWED_RANGE_A1,
    editableColumns: WEBAPP_ALLOWED_COLUMN_NAMES
  };
}

function generateAiAgentToken() {
  const token = "agt_" + Utilities.getUuid().replace(/-/g, "");
  PropertiesService.getScriptProperties().setProperty(WEBAPP_TOKEN_PROPERTY, token);
  return getAiAgentTokenInfo();
}

function resetAiAgentToken() {
  return generateAiAgentToken();
}

function testWebAppApiRead_() {
  const response = doGet({ parameter: { sheet: WEBAPP_TARGET_SHEET_NAME } });
  return response.getContent();
}

function testWebAppApiWrite_() {
  const response = doPost({
    postData: {
      contents: JSON.stringify({
        token: getAiAgentToken_(),
        sheet: WEBAPP_TARGET_SHEET_NAME,
        rowNumber: 3,
        column: "log",
        value: "Updated by Apps Script API test helper"
      })
    }
  });
  return response.getContent();
}

function normalizeColumnName_(value) {
  return String(value || "").trim();
}

function getAiAgentToken_() {
  const scriptProps = PropertiesService.getScriptProperties();
  let token = scriptProps.getProperty(WEBAPP_TOKEN_PROPERTY);
  if (!token) {
    token = "agt_" + Utilities.getUuid().replace(/-/g, "");
    scriptProps.setProperty(WEBAPP_TOKEN_PROPERTY, token);
  }
  return token;
}
