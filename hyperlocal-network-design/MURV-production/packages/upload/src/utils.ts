import { IUploadTextProps, ICurrentState, ITemplateProps } from "./types";
import { AVAILABLE_STATES } from "./constants";

/**
 * For getting the upload label basis the current state
 * it only needs to be displayed if the user has sent the label prop
 */
export const getUploadLabelText = (
  currentState: ICurrentState,
  uploadText?: IUploadTextProps,
): string => {
  if (uploadText) {
    switch (currentState) {
      case AVAILABLE_STATES.BEFORE_UPLOAD:
        return uploadText.beforeUploadText || "";
      case AVAILABLE_STATES.DO_UPLOAD:
        return uploadText.doUploadText || "";
      case AVAILABLE_STATES.UPLOADING:
        return uploadText.uploadingText || "";
      case AVAILABLE_STATES.UPLOAD_SUCCESS:
        return uploadText.uploadSuccessText || "";
      case AVAILABLE_STATES.UPLOAD_FAILED:
        return uploadText.uploadFailedText || "";
      default:
        return "";
    }
  }
  return "";
};

/**
 * For checking if the template needs to be shown basis the current state
 * it only needs to be shwon if the user has sent the label prop and on certain states of upload
 */
export const showTemplate = (
  currentState: ICurrentState,
  templateProps?: ITemplateProps,
): boolean => {
  const showTemplateStates: ICurrentState[] = [
    AVAILABLE_STATES.BEFORE_UPLOAD,
    AVAILABLE_STATES.DO_UPLOAD,
    AVAILABLE_STATES.UPLOADING,
  ];
  if (templateProps && showTemplateStates.includes(currentState)) {
    return true;
  }
  return false;
};

/**
 * For validating if the selected file format is valid
 */
export const isSelectedFormatValid = (fileFormat: string, acceptedFormats: string[]): boolean =>
  // Check if the file type matches any of the accepted formats
  acceptedFormats.some((format) => {
    if (format.endsWith("/*")) {
      // For wildcard formats like 'image/*', check if the file type starts with the prefix
      return fileFormat.startsWith(format.substring(0, format.length - 1));
    }
    // For specific formats, check if the file type exactly matches
    return fileFormat === format;
  });

export const removeFile = (
  prevFiles: FileList | null,
  fileToRemove: File,
  isPopoverUpload: boolean,
) => {
  if (!prevFiles || isPopoverUpload) return null;

  const newFilesArray = Array.from(prevFiles).filter((file) => file.name !== fileToRemove.name);
  if (newFilesArray.length === 0) {
    return null;
  }
  const dataTransfer = new DataTransfer();
  newFilesArray.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
};
