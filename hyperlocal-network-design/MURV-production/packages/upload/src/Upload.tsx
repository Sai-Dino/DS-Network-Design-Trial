import React, { useState, useEffect, useRef } from "react";
import { Label } from "@murv/label";
import { Button } from "@murv/button";
import { Download, Draft, Cancel, CheckCircle, Error } from "@murv/icons";
import { useMURVContext } from "@murv/provider";
import {
  AVAILABLE_STATES,
  BUTTON_LABEL,
  UPLOAD_STATUS,
  UPLOAD_FAILUE,
  DEFAULT_MAX_FILE_SIZE,
  FILE_SIZE_FAILURE,
  FILE_TYPE_FAILURE,
  INPUT_LABEL,
} from "./constants";
import { IUploadComponentProps, ICurrentState, IUploadStatus } from "./types";
import { getUploadLabelText, showTemplate, isSelectedFormatValid, removeFile } from "./utils";
import TemplateContainer from "./TemplateContainer";
import { LoadingIcon } from "./Icon";
import {
  UploadWrapper,
  UploadButton,
  UploadText,
  FileDetailWrapper,
  FileItem,
  FileItemNameContainer,
  MultipleFileItemNameContainer,
  FileItemName,
  FileItemPostIcon,
  ErrorMessage,
} from "./style";

export const Upload: React.FC<IUploadComponentProps> = ({
  dataTestId = "upload-test-id",
  id = "upload-file-id",
  multiple = false,
  accept = "image/*",
  fileMaxSize = DEFAULT_MAX_FILE_SIZE,
  uploadText,
  onSelection,
  onUploadingCancel,
  onUpload,
  onClose,
  templateProps,
  isPopoverUpload,
  uploadSuccessMessage,
  onDocDeleteCallback = () => {},
  autoUpload = false,
}) => {
  const [currentState, setCurrentState] = useState<ICurrentState>(AVAILABLE_STATES.BEFORE_UPLOAD);
  const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [triggerAutoUpload, setTriggerAutoUpload] = useState(false);

  const uploadTextLabel = getUploadLabelText(currentState, uploadText);
  const clickTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const iconTimeoutId = useRef<NodeJS.Timeout | null>(null);

  useEffect(
    () => () => {
      if (clickTimeoutId?.current) {
        clearTimeout(clickTimeoutId?.current);
      }
      if (iconTimeoutId?.current) {
        clearTimeout(iconTimeoutId?.current);
      }
    },
    [],
  );

  function arrayToFileList(files: File[]): FileList {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    return dataTransfer.files;
  }

  const mergeFiles = () => {
    if (uploadedFiles && selectedFiles) {
      const uploadedArray = Array.from(uploadedFiles);
      const selectedArray = Array.from(selectedFiles);
      const mergedArray = uploadedArray.concat(selectedArray);

      const mergedFileList = arrayToFileList(mergedArray);
      setUploadedFiles(mergedFileList);
    } else if (selectedFiles) {
      setUploadedFiles(selectedFiles);
    }
  };

  const handleUploadFile = () => {
    onUpload(selectedFiles!)
      .then((res: IUploadStatus) => {
        if (res === UPLOAD_STATUS.SUCCESS) {
          mergeFiles();
          setSelectedFiles(null);
          setCurrentState(AVAILABLE_STATES.UPLOAD_SUCCESS);
        } else if (res === UPLOAD_STATUS.FAILED) {
          setErrorMessage(UPLOAD_FAILUE);
          setCurrentState(AVAILABLE_STATES.UPLOAD_FAILED);
        } else if (autoUpload) {
          setSelectedFiles(null);
          if (uploadedFiles === null) {
            setCurrentState(AVAILABLE_STATES.BEFORE_UPLOAD);
          }
        } else {
          setCurrentState(AVAILABLE_STATES.DO_UPLOAD);
        }
      })
      .catch(() => setCurrentState(AVAILABLE_STATES.UPLOAD_FAILED));
  };

  useEffect(() => {
    if (triggerAutoUpload && selectedFiles) {
      setCurrentState(AVAILABLE_STATES.UPLOADING);
      handleUploadFile();
      setTriggerAutoUpload(false);
    }
  }, [triggerAutoUpload, selectedFiles]);

  const handleButtonClick = () => {
    clickTimeoutId.current = setTimeout(() => {
      if (selectedFiles) {
        switch (currentState) {
          case AVAILABLE_STATES.DO_UPLOAD:
            setCurrentState(AVAILABLE_STATES.UPLOADING);
            handleUploadFile();
            break;
          case AVAILABLE_STATES.UPLOADING:
            setCurrentState(AVAILABLE_STATES.BEFORE_UPLOAD);
            onUploadingCancel();
            break;
          case AVAILABLE_STATES.UPLOAD_SUCCESS:
            setCurrentState(AVAILABLE_STATES.BEFORE_UPLOAD);
            setSelectedFiles(null);
            if (isPopoverUpload && onClose) {
              onClose();
            }
            break;
          case AVAILABLE_STATES.UPLOAD_FAILED:
            setCurrentState(AVAILABLE_STATES.UPLOADING);
            setErrorMessage("");
            handleUploadFile();
            break;
          default:
            break;
        }
      } else if (currentState === AVAILABLE_STATES.UPLOAD_SUCCESS) {
        setCurrentState(AVAILABLE_STATES.BEFORE_UPLOAD);
        setSelectedFiles(null);
        if (isPopoverUpload && onClose) {
          onClose();
        }
      }
    }, 0);
  };

  // Function to handle the download of multiple files
  const downloadFiles = () => {
    Array.from(selectedFiles!).forEach((file) => {
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const getPopoverFileName = (files: FileList | null, isUploading: boolean) => {
    if (!files) return "";
    if (files.length === 1) {
      return (
        <FileItemNameContainer
          isUploading={isUploading}
          target="_blank"
          rel="noreferrer"
          download={files[0].name}
          href={URL.createObjectURL(files[0])}
        >
          <FileItemName>{files[0].name}</FileItemName>
          <Download />
        </FileItemNameContainer>
      );
    }
    return (
      <MultipleFileItemNameContainer isUploading={isUploading} onClick={downloadFiles}>
        <FileItemName>{files.length} files</FileItemName>
        <Download />
      </MultipleFileItemNameContainer>
    );
  };

  const getFileName = (file: File, isUploading: boolean) => (
    <FileItemNameContainer
      isUploading={isUploading}
      target="_blank"
      rel="noreferrer"
      download={file.name}
      href={URL.createObjectURL(file)}
    >
      <FileItemName>{file.name}</FileItemName>
      <Download />
    </FileItemNameContainer>
  );
  /**
   * For showing the pre-icon in the selected file
   */
  const getFileItemPreIcon = (state: ICurrentState) => {
    const { theme } = useMURVContext();
    switch (state) {
      case AVAILABLE_STATES.DO_UPLOAD:
        return <Draft />;
      case AVAILABLE_STATES.UPLOADING:
        return <LoadingIcon />;
      case AVAILABLE_STATES.UPLOAD_SUCCESS:
        return <CheckCircle color={theme.color.icon.success} />;
      case AVAILABLE_STATES.UPLOAD_FAILED:
        return <Error color={theme.color.icon.danger} />;
      default:
        return "";
    }
  };

  const handleUploadPostIconClick = (files: File | FileList) => {
    iconTimeoutId.current = setTimeout(() => {
      const newFileList = removeFile(uploadedFiles, files, isPopoverUpload);
      setUploadedFiles(newFileList);
      onDocDeleteCallback(files);
      if (newFileList === null && selectedFiles === null) {
        setCurrentState(AVAILABLE_STATES.BEFORE_UPLOAD);
      }
    }, 0);
  };

  /**
   * For handling the post-icon click in the selected file
   */
  const handlePostIconClick = (files: File | FileList) => {
    iconTimeoutId.current = setTimeout(() => {
      const newFileList = removeFile(selectedFiles, files, isPopoverUpload);
      switch (currentState) {
        case AVAILABLE_STATES.DO_UPLOAD:
          setSelectedFiles(newFileList);
          if (newFileList === null && uploadedFiles === null) {
            setCurrentState(AVAILABLE_STATES.BEFORE_UPLOAD);
          } else if (newFileList === null) {
            setCurrentState(AVAILABLE_STATES.UPLOAD_SUCCESS);
          }
          break;
        case AVAILABLE_STATES.UPLOADING:
          setCurrentState(AVAILABLE_STATES.BEFORE_UPLOAD);
          onUploadingCancel();
          break;
        case AVAILABLE_STATES.UPLOAD_SUCCESS:
          setSelectedFiles(newFileList);
          if (newFileList === null) {
            setCurrentState(AVAILABLE_STATES.BEFORE_UPLOAD);
          }
          onDocDeleteCallback(files);
          break;
        case AVAILABLE_STATES.UPLOAD_FAILED:
          setSelectedFiles(newFileList);
          if (newFileList === null && uploadedFiles === null) {
            setErrorMessage("");
            setCurrentState(AVAILABLE_STATES.BEFORE_UPLOAD);
          } else if (newFileList === null) {
            setErrorMessage("");
            setCurrentState(AVAILABLE_STATES.UPLOAD_SUCCESS);
          }
          break;
        default:
          break;
      }
    }, 0);
  };

  /**
   * For showing the post-icon in the selected file
   */
  const getFileItemPostIcon = (state: ICurrentState) => {
    switch (state) {
      case AVAILABLE_STATES.DO_UPLOAD:
        return <Cancel />;
      case AVAILABLE_STATES.UPLOADING:
        return <Cancel fill={state === AVAILABLE_STATES.UPLOADING} />;
      case AVAILABLE_STATES.UPLOAD_SUCCESS:
        return <Cancel />;
      case AVAILABLE_STATES.UPLOAD_FAILED:
        return <Cancel />;
      default:
        return "";
    }
  };

  const getUploadedFiles = () => {
    if (uploadedFiles === null) {
      return null;
    }

    if (isPopoverUpload) {
      return (
        <FileDetailWrapper>
          <FileItem>
            {getFileItemPreIcon(AVAILABLE_STATES.UPLOAD_SUCCESS)}
            {getPopoverFileName(uploadedFiles, false)}
          </FileItem>
          <FileItemPostIcon onClick={() => handleUploadPostIconClick(uploadedFiles)}>
            {getFileItemPostIcon(AVAILABLE_STATES.UPLOAD_SUCCESS)}
          </FileItemPostIcon>
        </FileDetailWrapper>
      );
    }

    const uploadedFilesArray = Array.from(uploadedFiles);
    return uploadedFilesArray.map((file) => (
      <FileDetailWrapper>
        <FileItem>
          {getFileItemPreIcon(AVAILABLE_STATES.UPLOAD_SUCCESS)}
          {getFileName(file, false)}
        </FileItem>
        <FileItemPostIcon onClick={() => handleUploadPostIconClick(file)}>
          {getFileItemPostIcon(AVAILABLE_STATES.UPLOAD_SUCCESS)}
        </FileItemPostIcon>
      </FileDetailWrapper>
    ));
  };

  const getFiles = () => {
    if (selectedFiles === null) {
      return null;
    }
    if (isPopoverUpload) {
      return (
        <FileDetailWrapper>
          <FileItem>
            {getFileItemPreIcon(currentState)}
            {getPopoverFileName(selectedFiles, currentState === AVAILABLE_STATES.UPLOADING)}
          </FileItem>
          <FileItemPostIcon onClick={() => handlePostIconClick(selectedFiles)}>
            {getFileItemPostIcon(currentState)}
          </FileItemPostIcon>
        </FileDetailWrapper>
      );
    }

    const selectedFilesArray = Array.from(selectedFiles);
    return selectedFilesArray.map((file) => (
      <FileDetailWrapper>
        <FileItem>
          {getFileItemPreIcon(currentState)}
          {getFileName(file, currentState === AVAILABLE_STATES.UPLOADING)}
        </FileItem>
        <FileItemPostIcon onClick={() => handlePostIconClick(file)}>
          {getFileItemPostIcon(currentState)}
        </FileItemPostIcon>
      </FileDetailWrapper>
    ));
  };

  /**
   * For handling the file selection
   */
  const onChangeHandler = (files: FileList | null) => {
    setSelectedFiles(files);
    setCurrentState(AVAILABLE_STATES.DO_UPLOAD);
    if (files) {
      const fileType = files[0].type;
      const supportedFormatArr = accept.split(",");

      if (!isSelectedFormatValid(fileType, supportedFormatArr)) {
        setErrorMessage(`${FILE_TYPE_FAILURE} Valid format(s) : ${accept}`);
      } else if (files[0].size > fileMaxSize) {
        const maxSizeInMb = (fileMaxSize / (1024 * 1024)).toFixed(2);
        setErrorMessage(`${FILE_SIZE_FAILURE} ${maxSizeInMb}mb.`);
      } else {
        if (onSelection) {
          onSelection(files);
        }
        if (autoUpload) {
          setTriggerAutoUpload(true);
        }
      }
    }
  };

  return (
    <UploadWrapper>
      {uploadTextLabel && <UploadText>{uploadTextLabel}</UploadText>}
      {currentState !== AVAILABLE_STATES.BEFORE_UPLOAD && (
        <>
          {getUploadedFiles()}
          {getFiles()}
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
          {currentState === AVAILABLE_STATES.UPLOAD_SUCCESS && uploadSuccessMessage}
        </>
      )}
      {currentState === AVAILABLE_STATES.BEFORE_UPLOAD ||
      (currentState === AVAILABLE_STATES.UPLOAD_SUCCESS && multiple) ? (
        <UploadButton>
          <input
            data-test-id={dataTestId}
            id={id}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(inputFiles: React.ChangeEvent<HTMLInputElement>) =>
              onChangeHandler(inputFiles.target.files)
            }
          />
          <Label htmlFor={id}>{INPUT_LABEL[currentState]}</Label>
        </UploadButton>
      ) : null}
      {((isPopoverUpload && currentState === AVAILABLE_STATES.UPLOAD_SUCCESS) ||
        currentState !== AVAILABLE_STATES.UPLOAD_SUCCESS) &&
      autoUpload !== true &&
      currentState !== AVAILABLE_STATES.BEFORE_UPLOAD ? (
        <Button
          buttonType="secondary"
          size="small"
          className="button"
          onClick={handleButtonClick}
          disabled={!!errorMessage && currentState !== AVAILABLE_STATES.UPLOAD_FAILED}
          dataTestId={BUTTON_LABEL[currentState]}
        >
          {BUTTON_LABEL[currentState]}
        </Button>
      ) : null}
      {showTemplate(currentState, templateProps) ? (
        <TemplateContainer templateProps={templateProps!} />
      ) : null}
    </UploadWrapper>
  );
};
