import { AVAILABLE_STATES, UPLOAD_STATUS } from "./constants";

export type ICurrentState = (typeof AVAILABLE_STATES)[keyof typeof AVAILABLE_STATES];
export type IUploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];

/**
 * Props for the upload text
 * @property beforeUploadText - Text to be displayed before the user selects the file
 * @property doUploadText - Text to be displayed after the user selects the file
 * @property uploadingText - Text to be displayed while the file is being uploaded
 * @property uploadSuccessText - Text to be displayed after the file is uploaded successfully
 * @property uploadFailedText - Text to be displayed after the file upload fails
 */
export interface IUploadTextProps {
  beforeUploadText: string;
  doUploadText: string;
  uploadingText: string;
  uploadSuccessText: string;
  uploadFailedText: string;
}

/**
 * Props for the template
 * @property actionLabel - Label for the template
 * @property templateText - Template download button label
 * @property onTemplateDownload - Callback to be called when the template download is clicked
 */
export interface ITemplateProps {
  actionLabel: string;
  templateText: string;
  onTemplateDownload: () => void;
}

/**
 * Props for the upload component
 * @property id - Id for the upload component
 * @property dataTestId - Id for the upload component for testing
 * @property multiple - Whether the user can select multiple files
 * @property accept - File types to be accepted
 * @property fileMaxSize - Maximum file size in bytes
 * @property uploadText - Text to be displayed for the upload component
 * @property onSelection - Callback to be called when the user selects the file
 * @property onUploadingCancel - Callback to be called when the user cancels the upload
 * @property onUpload - Callback to be called when the user clicks the upload button
 * @property onClose - Callback to be called to close the popover upload when the file uploading is complete and the user clicks the done button
 * @property isPopoverUpload - Whether the upload component is from the popover
 * @property uploadSuccessMessage - Message to be displayed after the file is uploaded successfully
 * @property templateProps - Props for the template
 * @property onDocDeleteCallback - Callback when doc will be deleted, argument will be getting FileList when isPopoverupload is passed as true otherwise it will receive File
 * @property autoUpload - auto uploads the file after file selection
 */
export interface IUploadComponentProps {
  id: string;
  dataTestId: string;
  multiple?: boolean;
  accept?: string;
  fileMaxSize?: number;
  uploadText?: IUploadTextProps;
  onSelection?: (files: FileList) => void;
  onUploadingCancel: () => void;
  onUpload: (files: FileList) => Promise<IUploadStatus>;
  onClose?: () => void;
  isPopoverUpload?: boolean;
  uploadSuccessMessage?: React.ReactNode;
  templateProps?: ITemplateProps;
  onDocDeleteCallback?: (selectedFiles: FileList | File) => void;
  autoUpload?: boolean;
}
