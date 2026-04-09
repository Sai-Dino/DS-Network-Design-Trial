import styled, { css } from "styled-components";
import { CalenderType } from "./types";

export const FlexDiv = styled.div`
  display: flex;
  align-items: center;
`;

export const ButtonContainer = styled.div`
  display: flex;
  margin-left: auto;
`;

export const Table = styled.table`
  width: 100%;
  padding: ${({ theme }) => theme.murv.spacing.s};
  justify-content: center;
`;

export const MonthGridContainer = styled(Table)``;

export const SubGridContainer = styled(Table)``;

export const TableHead = styled.thead<{ itemCount?: number }>`
  display: grid;
  grid-template-columns: ${({ itemCount = 7 }) => `repeat(${itemCount}, 1fr)`};
`;

export const TableHeadData = styled.th<{ id?: string }>`
  padding: ${({ theme }) => theme.murv.spacing.xs};
  color: ${({ theme, id }) =>
    id && ["S", "S"].includes(id) ? theme.murv.color.icon.danger : theme.murv.color.icon.brand};
`;

export const TableRow = styled.tr<{ columns?: number }>`
  display: grid;
  grid-template-columns: ${({ columns = 7 }) => `repeat(${columns}, 1fr)`};
  align-items: center;
  justify-content: space-between;
  width: 100%;
  position: relative;
`;

export const TableData = styled.td<{
  selected?: boolean;
  disabled?: boolean;
  colSpan?: number;
  enableHover?: boolean;
  isUnderRange?: boolean;
  isRangeStarted?: boolean;
}>`
  text-align: center;
  padding: ${({ theme }) => theme.murv.spacing.xs};
  cursor: pointer;
  background-color: ${({ theme, selected }) =>
    selected ? theme.murv.color.surface.selected.default : "transparent"};
  color: ${({ theme, selected }) =>
    selected ? theme.murv.color.icon.brand : theme.murv.color.icon.primary};
  border-radius: ${({ theme, selected }) =>
    selected ? theme.murv.radius.s : theme.murv.radius[0]};
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -o-user-select: none;
  user-select: none;
  ${({ theme, disabled, colSpan, isUnderRange, isRangeStarted }) => {
    if (colSpan) {
      return css`
        display: grid;
        grid-template-columns: repeat(${colSpan}, 1fr);
      `;
    }

    if (isUnderRange) {
      return css`
        background-color: ${theme.murv.color.surface.neutral.pressed};
        color: ${theme.murv.color.text.primary};
        border-radius: ${theme.murv.radius[0]};
      `;
    }
    if (isRangeStarted) {
      return css`
        background-color: ${theme.murv.color.surface.neutral.hover};
        color: ${theme.murv.color.text.primary};
      `;
    }
    if (disabled) {
      return css`
        & {
          color: ${theme.murv.color.icon.disabled};
          pointer-events: none;
          cursor: not-allowed;
          background-color: transparent;
          user-select: none;
        }
      `;
    }

    return css``;
  }};
  &:hover {
    ${({ theme, enableHover, isRangeStarted, isUnderRange }) => {
      if (!enableHover || isRangeStarted || isUnderRange) {
        return css``;
      }

      return css`
        background-color: ${theme.murv.color.surface.selected.default};
        border-radius: ${theme.murv.radius.s};
      `;
    }}
  }
`;

export const Quater = styled.span`
  color: ${({ theme }) => theme.murv.color.text.brand};
`;

export const TableBody = styled.tbody`
  text-align: center;
  padding: ${({ theme }) => theme.murv.spacing.xs};
`;

export const DatePickerContainer = styled(FlexDiv)<{ type?: CalenderType }>`
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.murv.spacing[0]};
  flex-shrink: ${({ theme }) => theme.murv.spacing.l};
  border-radius: ${({ theme }) => theme.murv.radius.xl};
  background: ${({ theme }) => theme.murv.color.surface.neutral.default};
  box-shadow: 0px 4px 8px 4px rgba(0, 0, 0, 0.08);
  min-width: 265px;
  height: 100%;
  padding: ${({ theme }) => theme.murv.spacing.l} 0;
  width: min-content;
  justify-content: space-between;
  ${({ type = "SINGLE" }) => {
    if (type === "RANGE") {
      return css`
        min-width: 500px;
      `;
    }
    return css``;
  }}
`;

export const FooterContainer = styled(FlexDiv)`
  justify-content: flex-end;
  width: 100%;
  padding: ${({ theme }) => theme.murv.spacing.s};
`;

export const RangeBarContainer = styled.div`
  display: flex;
  justify-content: center;
`;

export const TimePickerWrapper = styled.div`
  display: inline-flex;
  justify-content: space-between;
  align-items: center;
  border-radius: ${({ theme }) => theme.murv.radius.l};
  width: auto;
  box-sizing: border-box;
`;

export const TimePickerContainer = styled.div`
  margin-top: ${({ theme }) => theme.murv.spacing.m};
`;

export const Input = styled.input`
  width: 50px;
  padding: ${({ theme }) => theme.murv.spacing.xs} ${({ theme }) => theme.murv.spacing.m};;
  text-align: center;
  border-radius: ${({ theme }) => theme.murv.radius.s};
  border: 2px solid ${({ theme }) => theme.murv.color.stroke.primary};
  margin: 0 ${({ theme }) => theme.murv.spacing.xxs};
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  cursor: pointer;
height: 36px;
   &:focus {ß
    outline: none;
    border-color: ${({ theme }) => theme.murv.color.icon.brand} 
  }
`;

export const Colon = styled.span`
  font-size: ${({ theme }) => theme.murv.typography.heading.l.size};
`;

export const MeridiemContainer = styled.div`
  display: flex;
  border: 2px solid ${({ theme }) => theme.murv.color.stroke.primary};
  border-radius: ${({ theme }) => theme.murv.radius.s};
  overflow: hidden;
  width: 74px;
  height: 36px;
  margin: 0 ${({ theme }) => theme.murv.spacing.m};
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  align-items: center;
`;

export const MeridiemBox = styled.div<{ isSelected: boolean }>`
  flex: 1;
  padding: ${({ theme }) => theme.murv.spacing.xs};
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.murv.color.surface.selected.default : "transparent"};
  color: ${({ theme, isSelected }) =>
    isSelected ? theme.murv.color.icon.brand : theme.murv.color.icon.primary};
  cursor: pointer;
  &:first-child {
    border-right: 2px solid ${({ theme }) => theme.murv.color.stroke.primary};
  }
  &:hover {
    color: ${({ theme }) => theme.murv.color.icon.brand};
  }
  display: flex;
  align-items: center;
  height: 100%;
`;
