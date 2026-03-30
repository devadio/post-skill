/**
 * DriveService.gs
 * Extracts Drive IDs and fetches Blobs for single files and folders.
 */

const DRIVE_ID_REGEX = /[-\w]{25,}/;
const SUPPORTED_UPLOAD_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4"
]);

function isSupportedUploadMime_(mimeType) {
  return SUPPORTED_UPLOAD_MIMES.has(String(mimeType || "").toLowerCase());
}

function inferUploadMimeType_(fileName, contentType) {
  const loweredName = String(fileName || "").toLowerCase();
  const loweredType = String(contentType || "").toLowerCase();

  if (loweredType === "image/png" || /\.png$/i.test(loweredName)) return "image/png";
  if (loweredType === "image/jpeg" || /\.jpe?g$/i.test(loweredName)) return "image/jpeg";
  if (loweredType === "image/webp" || /\.webp$/i.test(loweredName)) return "image/webp";
  if (loweredType === "video/mp4" || /\.mp4$/i.test(loweredName)) return "video/mp4";
  return loweredType || "application/octet-stream";
}

function normalizeUploadBlob_(blob, originalName) {
  const contentType = String(blob.getContentType ? blob.getContentType() : "").toLowerCase();
  const providedName = String(originalName || (blob.getName ? blob.getName() : "") || "").trim();
  let fileName = providedName;
  const mimeType = inferUploadMimeType_(fileName, contentType);

  if (!/\.[a-z0-9]+$/i.test(fileName)) {
    if (mimeType === "image/png") fileName += ".png";
    else if (mimeType === "image/jpeg") fileName += ".jpg";
    else if (mimeType === "image/webp") fileName += ".webp";
    else if (mimeType === "video/mp4") fileName += ".mp4";
  }

  if (!fileName) {
    if (mimeType === "image/png") fileName = "upload.png";
    else if (mimeType === "image/jpeg") fileName = "upload.jpg";
    else if (mimeType === "image/webp") fileName = "upload.webp";
    else if (mimeType === "video/mp4") fileName = "upload.mp4";
    else fileName = "upload.bin";
  }

  return Utilities.newBlob(blob.getBytes(), mimeType, fileName);
}

function isDriveFolderMime_(mimeType) {
  return String(mimeType || "").toLowerCase() === "application/vnd.google-apps.folder";
}

function processMedia(url, mediaType) {
  const match = url.match(DRIVE_ID_REGEX);
  if (!match) {
    throw new Error("Invalid Google Drive URL. Could not extract the ID.");
  }

  const driveId = match[0];
  const blobs = [];
  const normalizedMediaType = (typeof normalizeMediaType_ === "function")
    ? normalizeMediaType_(mediaType)
    : String(mediaType || "").toLowerCase().trim();

  if (normalizedMediaType === "carousel") {
    // FOLDER ITERATION
    const folder = DriveApp.getFolderById(driveId);
    const files = folder.getFiles();

    while (files.hasNext()) {
      const file = files.next();
      const mimeType = String(file.getMimeType ? file.getMimeType() : "").toLowerCase();
      if (!isSupportedUploadMime_(mimeType)) {
        console.log("Skipping unsupported carousel file: " + file.getName() + " (" + mimeType + ")");
        continue;
      }
      blobs.push(normalizeUploadBlob_(file.getBlob(), file.getName()));
    }

    if (blobs.length === 0) {
      throw new Error("The specified Drive folder is empty.");
    }
  } else {
    // SINGLE FILE EXTRACTION
    const file = DriveApp.getFileById(driveId);
    const mimeType = String(file.getMimeType ? file.getMimeType() : "").toLowerCase();
    if (isDriveFolderMime_(mimeType)) {
      const folder = DriveApp.getFolderById(driveId);
      const files = folder.getFiles();

      while (files.hasNext()) {
        const folderFile = files.next();
        const folderMimeType = String(folderFile.getMimeType ? folderFile.getMimeType() : "").toLowerCase();
        if (!isSupportedUploadMime_(folderMimeType)) {
          console.log("Skipping unsupported carousel file: " + folderFile.getName() + " (" + folderMimeType + ")");
          continue;
        }
        blobs.push(normalizeUploadBlob_(folderFile.getBlob(), folderFile.getName()));
      }

      if (blobs.length === 0) {
        throw new Error("The specified Drive folder is empty.");
      }
    } else if (!isSupportedUploadMime_(mimeType)) {
      throw new Error("Invalid media file type: " + mimeType + ". Use jpeg, jpg, png, webp, or mp4.");
    } else {
      blobs.push(normalizeUploadBlob_(file.getBlob(), file.getName()));
    }
  }

  return blobs;
}
