import React from 'react';
import { Upload, IUploadComponentProps } from '@murv/upload';
import { VisibilityToggleHelper, IVisibilityToggleHelperRef } from "@murv/visibility-toggle";
import { defaultUploadText } from './constants';
import { IPopoverUpload } from './types';
import { PopoverWrapper } from './styles';
import PopoverHeader from './PopoverHeader';

type PopoverUploadProps =  IPopoverUpload & IUploadComponentProps;

export const PopoverUpload: React.FC<PopoverUploadProps> = ({ showBack = false, showCancel = false, headerText, onClose, renderTarget, popoverAction="click", popoverPosition= "bottom-center", isPopoverOpen, onVisibilityChange, offset, uploadText, ...props }) => {
    const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);
    const closePopover = () => {
        if (onClose) {
            onClose();
        }
        toggleRef?.current?.close();
    }
    return (
        <VisibilityToggleHelper renderTarget={renderTarget} action={popoverAction} testId="popover-upload" position={popoverPosition} initialIsVisible={isPopoverOpen} onVisibilityChange={onVisibilityChange} offset={offset} ref={toggleRef}>
            <PopoverWrapper>
                <PopoverHeader showBack={showBack} showCancel={showCancel} headerText={headerText} onClose={closePopover} />
                <Upload uploadText={uploadText ?? defaultUploadText} {...props} isPopoverUpload onClose={closePopover} />
            </PopoverWrapper>
        </VisibilityToggleHelper>
    )
};