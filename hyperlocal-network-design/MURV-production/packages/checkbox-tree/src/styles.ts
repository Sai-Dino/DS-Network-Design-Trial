import styled from "styled-components";

export const FilterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const FilterWrapperChild = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${(props) => props.theme.murv.spacing.l} ${(props) => props.theme.murv.spacing.xl};
  &[data-gutter-free="true"] {
    padding: ${(props) => props.theme.murv.spacing[0]};
  }
`;

export const TreeWrapper = styled.div`
  padding: ${(props) => {
    const { spacing } = props.theme.murv;

    return `${spacing[0]} ${spacing[0]} ${spacing.m} ${spacing.s}`;
  }};
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

export const NodeItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.theme.murv.spacing.m} ${(props) => props.theme.murv.spacing[0]};

  /* Selected state - change background color of the direct checkbox wrapper only */
  & > div:has(input:checked) {
    background-color: ${(props) => props.theme.murv.color.surface.selected.default};
    transition: background-color 150ms ease-in-out;
  }
`;

export const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
`;
