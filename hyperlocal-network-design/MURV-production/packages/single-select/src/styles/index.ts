import styled from "styled-components";

export const SingleSelectContainer = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
  .button-icon-style {
    transform: rotate(45deg);
  }
`;

export const DropdownContent = styled.div<{ popOverWidth: string }>`
  width: ${({ popOverWidth }) => popOverWidth};
  background-color: ${(props) => props.theme.murv.color.surface.neutral.default};
  box-sizing: border-box;
`;

export const CheckmarkContainer = styled.div`
  max-height: 300px;
  padding: ${(props) => props.theme.murv.spacing.s} 0px;
  overscroll-behavior-y: auto;
  overflow-y: scroll;
  scrollbar-width: none;

  /* Apply styling to nested checkmark options */
  [data-checkmark-position] {
    &:hover {
      background-color: ${(props) => props.theme.murv.color.surface.neutral.hover};
    }

    &[data-checked="true"] {
      background-color: ${(props) => props.theme.murv.color.surface.selected.default};

      &:active {
        background-color: ${(props) => props.theme.murv.color.surface.selected.pressed};
      }

      &:hover {
        background-color: ${(props) => props.theme.murv.color.surface.selected.hover};
      }
    }
  }
`;

export const ResetContainer = styled.div`
  display: flex;
  padding: 12px 16px;
  justify-content: flex-end;
  box-shadow: 0 1px 0 0 #f0f0f0 inset;
  align-items: flex-start;
  background-color: ${(props) => props.theme.murv.color.surface.neutral.default};
`;
