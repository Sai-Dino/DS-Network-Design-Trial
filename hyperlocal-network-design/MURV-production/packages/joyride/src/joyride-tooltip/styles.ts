import styled from "styled-components";
import { Button } from "@murv/button";

const breakpoints = {
  mobile: "480px",
};

export const StyledButton = styled(Button)``;
export const StyledButtonSkip = styled(Button)`
  margin-right: auto;
`;
export const StyledButtonNext = styled(Button)`
  display: flex;
  align-items: center;
`;

export const Box = styled.div`
  box-sizing: border-box;
  margin: 0;
  min-width: 0;
`;

export const StyledContainer = styled.div`
  width: 340px;
  min-width: fit-content;
  box-sizing: border-box;
  padding: ${(props) => props.theme.murv.spacing.xxl};
  background: ${(props) => props.theme.murv.color.surface.brand.default};
  display: flex;
  gap: ${(props) => props.theme.murv.spacing.xl};
  flex-direction: column;
  border-radius: ${(props) => props.theme.murv.radius.l};
  @media (max-width: ${breakpoints.mobile}) {
    width: 320px;
    padding: ${(props) => props.theme.murv.spacing.xl};
    gap: ${(props) => props.theme.murv.spacing.s};
  }
`;

export const JoyrideTitle = styled.h3`
  color: ${(props) => props.theme.murv.color.text.inverse};
  font-size: ${(props) => props.theme.murv.typography.heading.s.size};
  font-weight: ${(props) => props.theme.murv.typography.heading.s.weight};
  line-height: ${(props) => props.theme.murv.typography.heading.s.lineHeight}; /* 160% */
  letter-spacing: ${(props) => props.theme.murv.typography.heading.s.letterSpacing}; /* 160% */
  font-style: normal;
  @media (max-width: ${breakpoints.mobile}) {
    font-size: ${(props) => props.theme.murv.typography.heading.m.size};
    font-weight: ${(props) => props.theme.murv.typography.heading.m.weight};
    line-height: ${(props) => props.theme.murv.typography.heading.m.lineHeight}; /* 160% */
    letter-spacing: ${(props) => props.theme.murv.typography.heading.m.letterSpacing}; /* 160% */
  }
`;

export const StyledContainerHeader = styled.div`
  position: relative;
  display: flex;
  gap: ${(props) => props.theme.murv.spacing.l};
  align-items: start;
  justify-content: space-between;
`;
export const StyledContainerContent = styled.p`
  color: ${(props) => props.theme.murv.color.text.inverse};
  font-size: ${(props) => props.theme.murv.typography.body.s.size};
  font-weight: ${(props) => props.theme.murv.typography.body.s.weight};
  line-height: ${(props) => props.theme.murv.typography.body.s.letterSpacing}; /* 153.846% */
  font-style: normal;
  @media (max-width: ${breakpoints.mobile}) {
    font-size: ${(props) => props.theme.murv.typography.body.sBold.size};
    font-weight: ${(props) => props.theme.murv.typography.body.sBold.weight};
    line-height: ${(props) => props.theme.murv.typography.body.sBold.lineHeight};
    letter-spacing: ${(props) => props.theme.murv.typography.body.sBold.letterSpacing};
  }
`;

export const StepContainer = styled.div`
  box-sizing: border-box;
  padding: 0px 4px;
  border-radius: 100px;
  background: ${(props) => props.theme.murv.color.tag.category};
  color: ${(props) => props.theme.murv.color.icon.secondary};
  font-style: normal;
  font-size: ${(props) => props.theme.murv.typography.subtext.s.size};
  font-weight: ${(props) => props.theme.murv.typography.subtext.s.weight};
  line-height: ${(props) => props.theme.murv.typography.subtext.s.lineHeight}; /* 145.455% */
  letter-spacing: ${(props) => props.theme.murv.typography.subtext.s.letterSpacing};
`;

export const StyledContainerFooter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  margin-top: auto;
  gap: ${(props) => props.theme.murv.spacing.xl};
`;

export const StyledNavigationContainer = styled.div`
  display: flex;
  gap: ${(props) => props.theme.murv.spacing.s};
`;
