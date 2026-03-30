/**
 * WebAppApi.gs
 * Lightweight Google Sheets JSON API for AI agents.
 *
 * Read access is open.
 * Write access is limited to specific columns and protected by a shared token.
 */

const WEBAPP_SECRET_TOKEN = "your-custom-secure-token-123";
const WEBAPP_ALLOWED_COLUMNS_FOR_EDIT = ["Status", "Notes"];
const WEBAPP_DEFAULT_SHEET_NAME = "agent_api_demo";

function doGet(e) {
  try {
    const sheet = getWebAppTargetSheet_(e);
    const data = sheet.getDataRange().getValues();
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
    if (body.token !== WEBAPP_SECRET_TOKEN) {
      return createJsonOutput_({ success: false, error: "Unauthorized: Invalid or missing token." });
    }

    const rowNumber = Number(body.rowNumber);
    const columnName = String(body.column || "").trim();
    const newValue = body.value;

    if (!WEBAPP_ALLOWED_COLUMNS_FOR_EDIT.includes(columnName)) {
      return createJsonOutput_({ success: false, error: "Forbidden: Editing the '" + columnName + "' column is not allowed." });
    }
    if (!Number.isInteger(rowNumber) || rowNumber < 2) {
      return createJsonOutput_({ success: false, error: "Invalid rowNumber." });
    }

    const sheet = getWebAppTargetSheet_({ parameter: body });
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const colIndex = headers.indexOf(columnName) + 1;
    if (colIndex === 0) {
      return createJsonOutput_({ success: false, error: "Column not found." });
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

  const preferredName = requestedName || WEBAPP_DEFAULT_SHEET_NAME;
  const namedSheet = ss.getSheetByName(preferredName);
  if (namedSheet) {
    return namedSheet;
  }

  const postSheet = ss.getSheetByName(POST_SHEET_NAME);
  if (postSheet && !requestedName) {
    return postSheet;
  }

  throw new Error("Sheet not found: " + preferredName);
}

function createJsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function testWebAppApiRead_() {
  const response = doGet({ parameter: { sheet: WEBAPP_DEFAULT_SHEET_NAME } });
  return response.getContent();
}

function testWebAppApiWrite_() {
  const response = doPost({
    postData: {
      contents: JSON.stringify({
        token: WEBAPP_SECRET_TOKEN,
        sheet: WEBAPP_DEFAULT_SHEET_NAME,
        rowNumber: 3,
        column: "Notes",
        value: "Updated by Apps Script API test helper"
      })
    }
  });
  return response.getContent();
}
