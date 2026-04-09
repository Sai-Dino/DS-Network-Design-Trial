import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent, screen } from "murv/test-utils";
import { PopoverUpload } from "../src";

describe('PopoverUpload Component', () => {
    const defaultProps = {
        dataTestId: "test",
        id: 'popover-upload',
        multiple: false,
        accept: 'image/*',
        uploadText: {
            beforeUploadText: 'Select the file to upload',
            doUploadText: 'Upload selected file',
            uploadingText: 'Uploading selected file...',
            uploadSuccessText: 'Upload successful!',
            uploadFailedText: 'Upload Failed!'
        },
        templateProps: {
            actionLabel: "Don’t have the template?",
            templateText: 'Download',
            onTemplateDownload: () => {}
        },
        onSelection: () => {},
        onUploadingCancel: () => {},
        onUpload: () => new Promise(resolve => {setTimeout(() => resolve('SUCCESS'), 1500)}),
        headerText: 'Bulk Consignment Schedule',
        popoverAction: 'click',
        popoverPosition: 'bottom-left',
        showBack: true,
        showCancel: true,
        offset: { x: 5, y: 10 },
    };

    it('snapshot test for upload component', () => {
      const tree = render(
        <PopoverUpload 
          {...defaultProps} 
          renderTarget={(props) => (
            <button {...props} style={{ padding: "4px" }} type="button">
              Target
            </button>
          )} />
        );
      const triggerNode = screen.getByTestId("trigger-popover-upload");
      fireEvent.click(triggerNode);
      expect(tree).toMatchSnapshot();
    });  
    it('popover header renders', () => {
      const { getByText } = render(
        <PopoverUpload 
          {...defaultProps} 
          renderTarget={(props) => (
            <button {...props} style={{ padding: "4px" }} type="button">
              Target
            </button>
          )} />
        );
      const triggerNode = screen.getByTestId("trigger-popover-upload");
      fireEvent.click(triggerNode);
      expect(getByText('Bulk Consignment Schedule')).toBeInTheDocument();
    });
    it('renders with default props', () => {
      const { getByText } = render(
        <PopoverUpload 
          {...defaultProps} 
          renderTarget={(props) => (
            <button {...props} style={{ padding: "4px" }} type="button">
              Target
            </button>
          )} />
        );
      const triggerNode = screen.getByTestId("trigger-popover-upload");
      fireEvent.click(triggerNode);
      expect(getByText('Select the file to upload')).toBeInTheDocument();
    });   
    it('handles template download click event', () => {
      const handleClick = jest.fn();
      const args = {
        ...defaultProps,
        templateProps: {
            actionLabel: "Don’t have the template?",
          templateText: 'Download',
          onTemplateDownload: handleClick
        }
      }
      const { getByTestId } = render(
        <PopoverUpload 
          {...args} 
          renderTarget={(props) => (
            <button {...props} style={{ padding: "4px" }} type="button">
              Target
            </button>
          )} />
        );
      const triggerNode = getByTestId("trigger-popover-upload");
      fireEvent.click(triggerNode);
      fireEvent.click(getByTestId('template-download'));
      expect(handleClick).toHaveBeenCalled();
    });
    it('should trigger handleFileChange function on file selection and upload success', () => {
      const handleClick = jest.fn();
      const handleUploadClick = jest.fn(() => Promise.resolve('SUCCESS'));
      global.URL.createObjectURL = jest.fn(() => 'details');
      const args = {
        ...defaultProps,      
        onSelection: handleClick,
        onUpload: handleUploadClick
      }
      // selecting the file 
      const { getByLabelText, getByText, getByTestId } = render(
        <PopoverUpload 
          {...args} 
          renderTarget={(props) => (
            <button {...props} style={{ padding: "4px" }} type="button">
              Target
            </button>
          )} />
        );
      const triggerNode = getByTestId("trigger-popover-upload");
      fireEvent.click(triggerNode);
    
      const file = new File(['file content'], 'test-file.svg', { type: 'image/*' });
      const inputElement = getByLabelText('Select File');
      fireEvent.change(inputElement, { target: { files: [file] } });
    
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(getByText('test-file.svg')).toBeInTheDocument();

      // clicking on upload button
      fireEvent.click(getByTestId('Upload'));
      setTimeout(() => expect(handleUploadClick).toHaveBeenCalledTimes(1));
    });
    it('should trigger handleFileChange function on file selection and upload failed', () => {
        const handleClick = jest.fn();
        const handleUploadClick = jest.fn(() => Promise.resolve('FAILED'));
        global.URL.createObjectURL = jest.fn(() => 'details');
        const args = {
          ...defaultProps,      
          onSelection: handleClick,
          onUpload: handleUploadClick
        }
        // selecting the file 
        const { getByLabelText, getByText, getByTestId } = render(
          <PopoverUpload 
            {...args} 
            renderTarget={(props) => (
              <button {...props} style={{ padding: "4px" }} type="button">
                Target
              </button>
            )} />
          );
      
        const file = new File(['file content'], 'test-file.svg', { type: 'image/*' });
        const inputElement = getByLabelText('Select File');
        fireEvent.change(inputElement, { target: { files: [file] } });
      
        expect(handleClick).toHaveBeenCalledTimes(1);
        expect(getByText('test-file.svg')).toBeInTheDocument();
  
        // clicking on upload button
        fireEvent.click(getByTestId('Upload'));
        setTimeout(() => {
            expect(handleUploadClick).toHaveBeenCalledTimes(1);
            expect(getByText("There was an error while uploading the file, please try again!")).toBeInTheDocument();
            // clicking on retry button
            fireEvent.click(getByTestId('Retry'));
            setTimeout(() => expect(handleUploadClick).toHaveBeenCalledTimes(1));  
        });
    });
});