import styled from "styled-components";
import { BreadcrumbProps } from "./types";

export const BreadcrumbContainer = styled.div<BreadcrumbProps>`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: ${({ theme }) => theme.murv.spacing.xl};
`;

export const BreadcrumbElement = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.murv.spacing.s};
  margin-right: ${({ theme }) => theme.murv.spacing.xxs};
`;
