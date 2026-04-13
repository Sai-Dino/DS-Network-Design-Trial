import styled, { css } from "styled-components";
import { TableRow } from "../styles";
import { CalenderType } from "../types";

export const createFlexDiv = (element: keyof JSX.IntrinsicElements) => styled(element)`
  display: flex;
  align-items: center;
`;

export const FlexTD = createFlexDiv("td");
export const FlexDiv = createFlexDiv("div");

export const HeaderContainer = styled(FlexTD)`
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.murv.spacing.s};
  gap: ${({ theme }) => theme.murv.spacing.xs};
`;

export const NavigationControls = styled(FlexTD)<{ calenderType: CalenderType }>`
  cursor: pointer;
  justify-content: end;
  position: ${({ calenderType }) => (calenderType === "RANGE" ? "absolute" : "relative")};
  right: 0;
`;

export const TextLabel = styled.label`
  color: ${({ theme }) => theme.murv.color.icon.secondary};
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: Inter;
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  font-style: normal;
  font-weight: ${({ theme }) => theme.murv.typography.heading.m.weight};
  line-height: ${({ theme }) => theme.murv.typography.heading.m.lineHeight};
  width: fit-content;
  ${({ theme }) => css`
    padding: ${theme.murv.spacing.m} ${theme.murv.spacing.s};
  `};
`;

export const WrapperContainer = styled(TableRow)<{ showPadding?: boolean }>`
  position: relative;
  > fieldset {
    label {
      flex-basis: 33.3%;
    }
    [type="subtle"] {
      display: none;
    }
  }
  ${({ theme, showPadding = true }) =>
    showPadding
      ? css`
          padding: ${theme.murv.spacing.s};
          padding-left: ${theme.murv.spacing.s};
        `
      : css``}
`;

export const SegmentedContainer = styled.div`
  flex-basis: 33.3%;
`;
