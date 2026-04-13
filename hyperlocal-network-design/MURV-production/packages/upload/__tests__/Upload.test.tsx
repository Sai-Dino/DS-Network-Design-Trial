import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent } from "murv/test-utils";
import { Upload, UPLOAD_STATUS, IUploadStatus } from "../src";

describe("Upload Component", () => {
  const defaultProps = {
    dataTestId: "upload-01",
    id: "upload-01",
    multiple: false,
    accept: "image/*",
    uploadText: {
      beforeUploadText: "Select the file to upload",
      doUploadText: "Upload selected file",
      uploadingText: "Uploading selected file...",
      uploadSuccessText: "Upload successful!",
      uploadFailedText: "Upload Failed!",
    },
    templateProps: {
      actionLabel: "Don’t have the template?",
      templateText: "Download",
      onTemplateDownload: () => {},
    },
    onSelection: () => {},
    onUploadingCancel: () => {},
    onUpload: (): Promise<IUploadStatus> =>
      new Promise((resolve) => {
        setTimeout(() => resolve(UPLOAD_STATUS.SUCCESS), 1500);
      }),
  };
  it("snapshot test for upload component", () => {
    const { container } = render(<Upload {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });
  it("renders with default props", () => {
    const { getByText } = render(<Upload {...defaultProps} />);
    expect(getByText("Select the file to upload")).toBeInTheDocument();
  });
  it("renders with template", () => {
    const { getByText } = render(<Upload {...defaultProps} />);
    expect(getByText("Don’t have the template?")).toBeInTheDocument();
  });
  it("handles template download click event", () => {
    const handleClick = jest.fn();
    const args = {
      ...defaultProps,
      templateProps: {
        actionLabel: "Don’t have the template?",
        templateText: "Download",
        onTemplateDownload: handleClick,
      },
    };
    const { getByTestId } = render(<Upload {...args} />);
    fireEvent.click(getByTestId("template-download"));
    expect(handleClick).toHaveBeenCalled();
  });
  it("should trigger handleFileChange function on file selection and upload success", () => {
    const handleClick = jest.fn();
    const handleUploadClick = jest.fn(() => Promise.resolve(UPLOAD_STATUS.SUCCESS));
    global.URL.createObjectURL = jest.fn(() => "details");
    const args = {
      ...defaultProps,
      onSelection: handleClick,
      onUpload: handleUploadClick,
    };
    // selecting the file
    const { getByLabelText, getByText, getByTestId } = render(<Upload {...args} />);

    const file = new File(["file content"], "test-file.svg", { type: "image/*" });
    const inputElement = getByLabelText("Select File");
    fireEvent.change(inputElement, { target: { files: [file] } });

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(getByText("test-file.svg")).toBeInTheDocument();

    // clicking on upload button
    fireEvent.click(getByTestId("Upload"));
    setTimeout(() => expect(handleUploadClick).toHaveBeenCalledTimes(1));
  });
  it("should trigger handleFileChange function on file selection and upload failed", () => {
    const handleClick = jest.fn();
    const handleUploadClick = jest.fn(() => Promise.resolve(UPLOAD_STATUS.FAILED));
    global.URL.createObjectURL = jest.fn(() => "details");
    const args = {
      ...defaultProps,
      onSelection: handleClick,
      onUpload: handleUploadClick,
    };
    // selecting the file
    const { getByLabelText, getByText, getByTestId } = render(<Upload {...args} />);

    const file = new File(["file content"], "test-file.svg", { type: "image/*" });
    const inputElement = getByLabelText("Select File");
    fireEvent.change(inputElement, { target: { files: [file] } });

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(getByText("test-file.svg")).toBeInTheDocument();

    // clicking on upload button
    fireEvent.click(getByTestId("Upload"));
    setTimeout(() => {
      expect(handleUploadClick).toHaveBeenCalledTimes(1);
      expect(
        getByText("There was an error while uploading the file, please try again!"),
      ).toBeInTheDocument();
      // clicking on retry button
      fireEvent.click(getByTestId("Retry"));
      setTimeout(() => expect(handleUploadClick).toHaveBeenCalledTimes(1));
    });
  });
  it("handle upload multiple files", () => {
    const handleClick = jest.fn();
    const handleUploadClick = jest.fn(() => Promise.resolve(UPLOAD_STATUS.FAILED));
    global.URL.createObjectURL = jest.fn(() => "details");
    const args = {
      ...defaultProps,
      multiple: true,
      onSelection: handleClick,
      onUpload: handleUploadClick,
    };
    // selecting the file
    const { getByLabelText } = render(<Upload {...args} />);
    const file1 = new File(["file content"], "test-file1.svg", { type: "image/*" });
    const file2 = new File(["file content"], "test-file2.svg", { type: "image/*" });
    const inputElement = getByLabelText("Select File");
    fireEvent.change(inputElement, { target: { files: [file1, file2] } });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
