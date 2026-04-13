import styled, { css } from "styled-components";

export const breakpoint = {
  mobile: "480px",
};

const DialogBackdropStyles = css`
  background-color: rgba(0, 0, 0, 0.1);
`;

const DialogStyles = css`
  padding: ${({ theme }) => theme.murv.spacing.l};
  border-radius: ${({ theme }) => theme.murv.radius.xxl};
  background-color: ${({ theme }) => theme.murv.color.surface.neutral.default};
  border: ${({ theme }) => `${theme.murv.spacing.xxxs} solid ${theme.murv.color.stroke.primary}`};
  box-shadow: 0px 12px 24px 8px rgba(0, 0, 0, 0.08);
  margin: auto;
  overflow: hidden;
`;

const DialogActiveStyles = css`
  display: flex;
  flex-direction: column;
`;

export const DialogPolyfillWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: ${({ theme }) => theme.murv.zIndex.level3};
  ${DialogBackdropStyles};

  &[hidden] {
    display: none;
  }
`;

export const DialogPolyfillElement = styled.div`
  ${DialogStyles};
  ${DialogActiveStyles}

  &[hidden] {
    display: none;
  }
`;

export const DialogElement = styled.dialog`
  ${DialogStyles}

  &[open] {
    ${DialogActiveStyles}
  }

  &::backdrop {
    ${DialogBackdropStyles}
  }
`;
