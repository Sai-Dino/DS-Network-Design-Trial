import styled from "styled-components";

export const UploadWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 270px;
  padding: ${({ theme }) => theme.murv.spacing.xl};
  gap: ${({ theme }) => theme.murv.spacing.l};
  .button {
    width: fit-content;
  }
`;

export const UploadText = styled.div`
  display: inline-block;
  width: fit-content;
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  color: ${({ theme }) => theme.murv.color.text.primary};
`;

export const UploadButton = styled.div`
  display: inline-block;
  width: fit-content;
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  padding: ${({ theme }) => `${theme.murv.spacing.s} ${theme.murv.spacing.xl}`};
  border-radius: ${({ theme }) => theme.murv.spacing.s};
  border: 2px solid ${({ theme }) => theme.murv.color.stroke.primary};
  color: ${({ theme }) => theme.murv.color.text.brand};
  font-weight: ${({ theme }) => theme.murv.typography.body.sBold.weight};
  input[type="file"] {
    display: none;
  }
`;

export const FileDetailWrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  border-radius: ${({ theme }) => theme.murv.spacing.s};
  gap: ${({ theme }) => theme.murv.spacing.l};
  border: 1px solid ${({ theme }) => theme.murv.color.stroke.primary};
  background-color: ${({ theme }) => theme.murv.color.surface.selected.default};
  padding-left: ${({ theme }) => theme.murv.spacing.l};
`;

export const FileItem = styled.div`
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.murv.spacing.s} 0;
`;

export const FileItemNameContainer = styled.a<{ isUploading: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  color: ${({ theme, isUploading }) =>
    isUploading ? theme.murv.color.text.disabled : theme.murv.color.text.primary};
  border-bottom: 1px dashed
    ${({ theme, isUploading }) =>
      isUploading ? theme.murv.color.stroke.disabled : theme.murv.color.stroke.brand};
  margin-left: ${({ theme }) => theme.murv.spacing.s};
`;

export const MultipleFileItemNameContainer = styled.div<{ isUploading: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  color: ${({ theme, isUploading }) =>
    isUploading ? theme.murv.color.text.disabled : theme.murv.color.text.primary};
  border-bottom: 1px dashed
    ${({ theme, isUploading }) =>
      isUploading ? theme.murv.color.stroke.disabled : theme.murv.color.stroke.brand};
  margin-left: ${({ theme }) => theme.murv.spacing.s};
`;

export const FileItemName = styled.div`
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const FileItemPostIcon = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.murv.spacing.s};
  cursor: pointer;
`;

export const TemplateWrapper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.murv.spacing.l};
`;

export const TemplateActionLabel = styled.div`
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
`;

export const ErrorMessage = styled.div`
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: ${({ theme }) => theme.murv.typography.subtext.s.weight};
  line-height: ${({ theme }) => theme.murv.typography.body.s.lineHeight};
  color: ${({ theme }) => theme.murv.color.text.danger};
  max-width: 250px;
`;
