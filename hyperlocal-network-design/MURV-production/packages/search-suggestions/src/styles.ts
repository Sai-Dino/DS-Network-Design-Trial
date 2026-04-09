import styled from "styled-components";
import { ISearchOptionProps, ISearchSuggestionsStyleProps } from "./types";

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const StyledUnorderedList = styled.ul<ISearchSuggestionsStyleProps>`
  list-style-type: none;
  padding: 0;
  margin: 0;
  width: ${({ width }) => width || "280px"};

  padding: ${({ theme }) => `${theme.murv.spacing.xxxs} 0 ${theme.murv.spacing.xxxs} 0`};
  border-radius: ${({ theme }) => theme.murv.radius.s};
  background: ${({ theme }) => theme.murv.color.surface.neutral.default};
  box-shadow: ${({ theme }) =>
    `0px ${theme.murv.spacing.xs} ${theme.murv.spacing.s} ${theme.murv.spacing.xs} #00000014`};

  /* Font styles */
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-weight: ${({ theme, isHistory }) =>
    isHistory ? theme.murv.typography.subtext.s.weight : theme.murv.typography.body.sBold.weight};
  color: ${({ theme, isHistory }) =>
    isHistory ? theme.murv.color.text.primary : theme.murv.color.text.brand};
`;

export const StyledListItem = styled(FlexRow)`
  cursor: pointer;
  padding: ${({ theme }) => `${theme.murv.spacing.s} ${theme.murv.spacing.xl}`};
  gap: ${({ theme }) => theme.murv.spacing.s};
  max-character
`;

export const SearchOption = styled(FlexRow)<ISearchOptionProps>`
  gap: ${({ theme }) => theme.murv.spacing.l};
`;

export const CloseIconWrapper = styled.div``;

export const SearchText = styled.p`
  width: 188px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SearchValue = styled.span`
  font-weight: ${({ theme }) => theme.murv.typography.body.sBold.weight};
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;
