import React from 'react';
import { ArrowBack, Close } from "@murv/icons"
import { IconWrapper, PopoverHeaderWrapper, HeaderLabel } from './styles';

interface IPopoverHeaderProps {
  showBack?:boolean;
  showCancel?: boolean;
  headerText:string;
  onClose?: () => void;
}

const PopoverHeader: React.FC<IPopoverHeaderProps> = ({ showBack, showCancel, headerText, onClose }) => (
    <PopoverHeaderWrapper>
        {showBack && <IconWrapper onClick={onClose} data-test-id="arrow-back"><ArrowBack /></IconWrapper>}
        <HeaderLabel>{headerText}</HeaderLabel>
        {showCancel && <IconWrapper onClick={onClose} data-test-id="close"><Close /></IconWrapper>}
    </PopoverHeaderWrapper>
  )

export default PopoverHeader;