/**
 * Different states for the file upload
 */
export const AVAILABLE_STATES = {
  BEFORE_UPLOAD: "BEFORE_UPLOAD",
  DO_UPLOAD: "DO_UPLOAD",
  UPLOADING: "UPLOADING",
  UPLOAD_SUCCESS: "UPLOAD_SUCCESS",
  UPLOAD_FAILED: "UPLOAD_FAILED",
} as const;

/**
 * Button label for each download state
 */
export const INPUT_LABEL = {
  BEFORE_UPLOAD: "Select File",
  DO_UPLOAD: "Upload",
  UPLOADING: "Cancel",
  UPLOAD_SUCCESS: "Upload More Files",
  UPLOAD_FAILED: "Retry",
} as const;

export const BUTTON_LABEL = {
  BEFORE_UPLOAD: "Select File",
  DO_UPLOAD: "Upload",
  UPLOADING: "Cancel",
  UPLOAD_SUCCESS: "Done",
  UPLOAD_FAILED: "Retry",
} as const;

export const UPLOAD_STATUS = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCEL: "CANCEL",
} as const;

/**
 * Default text for the file upload failure message
 */
export const UPLOAD_FAILUE = "There was an error while uploading the file, please try again!";

/**
 * Error message for uploaded file type is not supported
 */
export const FILE_TYPE_FAILURE = "Uploaded file type is not supported.";

/**
 * Error message for uploaded file size exceeds the maximum limit
 */
export const FILE_SIZE_FAILURE = "File size exceeds max limit of";

/**
 * Default maximum file size in bytes for a file upload
 */
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
