import React from 'react';
import { Button } from "@murv/button";
import { ITemplateProps } from './types';
import { TemplateWrapper, TemplateActionLabel } from './style';

interface ITemplateContainerProps {
  templateProps: ITemplateProps
}

const TemplateContainer: React.FC<ITemplateContainerProps> = ({ templateProps }) => (
  <TemplateWrapper>
    <TemplateActionLabel>{templateProps.actionLabel}</TemplateActionLabel>
    <Button
      dataTestId="template-download"
      buttonType="inline"
      buttonStyle="brand"
      size="small"
      onClick={() => templateProps.onTemplateDownload()}
    >
      {templateProps.templateText}
    </Button>
  </TemplateWrapper>
);

export default TemplateContainer;
