import styled, { css, CSSObject, DefaultTheme } from "styled-components";

const breakpoints = {
  mobile: "480px",
};

const media = {
  mobile: (args: CSSObject) => css`
    @media (max-width: ${breakpoints.mobile}) {
      ${css(args)}
    }
  `,
};

const applyStyles = (
  theme: DefaultTheme,
  isSelected: boolean,
  isDisabled: boolean,
  type: "active" | "focus" | "hover" | "default",
) => {
  if (isDisabled) {
    return css`
      * {
        color: ${theme.murv.color.text.disabled};
      }
      background: ${theme.murv.color.surface.disabled.default};
      border: ${theme.murv.stroke.standard} solid ${theme.murv.color.surface.neutral.pressed};
      pointer-events: none;
    `;
  }
  const SELECTED_STYLES = {
    active: `
        background: ${theme.murv.color.surface.selected.pressed};
      `,
    focus: `
        background: ${theme.murv.color.surface.selected.hover};
        border: ${theme.murv.stroke.standard} solid ${theme.murv.color.stroke.secondary};
      `,
    hover: `
        background: ${theme.murv.color.surface.selected.hover};
      `,
    default: `
        background: ${theme.murv.color.surface.selected.default};
      `,
  };
  const UN_SELECTED_STYLES = {
    hover: css`
      background: ${theme.murv.color.surface.neutral.hover};
    `,
    focus: css`
      background: ${theme.murv.color.surface.neutral.hover};
      border: ${theme.murv.stroke.standard} solid ${theme.murv.color.stroke.secondary};
    `,
    active: css`
      background: ${theme.murv.color.surface.neutral.hover};
      border-bottom: ${theme.murv.stroke.standard} solid
        ${theme.murv.color.surface.information.pressed};
    `,
    default: css`
      background: ${theme.murv.color.surface.neutral.default};
      border-bottom: ${theme.murv.stroke.standard} solid ${theme.murv.color.surface.neutral.pressed};
    `,
  };
  if (isSelected) {
    return css`
      ${SELECTED_STYLES[type]}
    `;
  }
  return UN_SELECTED_STYLES[type];
};

export const StyledRow = styled.tr<{
  selected?: boolean;
  disabled?: boolean;
}>`
  border: ${({ theme }) => theme.murv.stroke.standard} solid transparent;
  ${({ theme, selected = false, disabled = false }) =>
    applyStyles(theme, selected, disabled, "default")};
  &:hover {
    ${({ theme, selected = false, disabled = false }) =>
      applyStyles(theme, selected, disabled, "hover")}
  }
  &:focus {
    ${({ theme, selected = false, disabled = false }) =>
      applyStyles(theme, selected, disabled, "focus")}
  }
  &:active {
    ${({ theme, selected = false, disabled = false }) =>
      applyStyles(theme, selected, disabled, "active")}
  }
`;
export const StyledTable = styled.table<{
  selected?: boolean;
  disabled?: boolean;
  fixedHeader?: boolean;
  numberOfFixedColumns?: number;
  columnWidths?: number[];
}>`
  white-space: nowrap;
  margin: 0;
  border: none;
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  th {
    color: ${({ theme }) => theme.murv.color.text.secondary};
    ${({ theme }) => media.mobile({ fontSize: theme.murv.typography.body.s.size })};
    padding: ${({ theme }) => theme.murv.spacing.s};
  }
  thead tr {
    border-bottom: ${({ theme }) => theme.murv.stroke.standard} solid
      ${({ theme }) => theme.murv.color.stroke.secondary};
  }
  td,
  th {
    padding: ${({ theme }) => theme.murv.spacing.s};
  }
  ${({ fixedHeader }) =>
    fixedHeader &&
    css`
      thead th {
        position: sticky;
        top: 0;
        z-index: ${({ theme }) => theme.murv.zIndex.level3};
        background: white;
      }
    `}
  tbody td {
    position: relative;
  }
  ${({ columnWidths, numberOfFixedColumns, theme }) =>
    columnWidths &&
    numberOfFixedColumns &&
    css`
      ${(() => {
        let styles = "";
        for (let index = 0; index < numberOfFixedColumns; index += 1) {
          const width = columnWidths[index - 1];
          styles += `
          tbody td:nth-child(${index + 1}) {
            position: sticky;
            z-index: ${theme.murv.zIndex.level1};
            left: ${index > 0 ? `${width}px` : 0};
            background: inherit;
          }
          thead th:nth-child(${index + 1}) {
            position: sticky;
            left: ${index > 0 ? `${width}px` : 0};
            z-index: ${theme.murv.zIndex.level2};;
            background: white;
          }
        `;
        }
        return styles;
      })()}
    `}
`;

export const TableWrapper = styled.div<{
  maxHeight?: string;
  enableScroll?: boolean;
}>`
  // Conditionally apply overflow based on whether we need TableWrapper to be the scroll container
  ${({ enableScroll }) =>
    enableScroll &&
    css`
      overflow: auto;
    `}
  ${({ maxHeight }) =>
    maxHeight &&
    css`
      max-height: ${maxHeight};
    `}
`;

export const HeaderWrapper = styled.div<{ isColumnSortable: boolean }>`
  ${({ isColumnSortable }) =>
    isColumnSortable &&
    css`
      align-items: center;
      display: flex;
    `}
`;

export const IconWrapper = styled.div`
  margin-left: ${({ theme }) => theme.murv.spacing.s};
  display: flex;
`;

export const TableNonDataRow = styled.div`
  display: flex;
  align-items: center;
  min-height: 200px;
  height: 100%;
`;

export const NonDataContainer = styled.div`
  position: absolute;
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
`;
