import styled from "styled-components";
import { StyledButtonGroupProps } from "../types";
import { alignmentUtils } from "../utils";

const FlexConatiner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const StyledContainer = styled(FlexConatiner)<StyledButtonGroupProps>`
  padding: ${(props) => (props.padding ? props.padding : props.theme.murv.spacing.l)};
  gap: ${(props) => (props.spacing ? props.spacing : props.theme.murv.radius.s)};
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  align-content: center;
  ${(props) => `justify-content: ${alignmentUtils[props.alignment || "left"]}`};
`;
