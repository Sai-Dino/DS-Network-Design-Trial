import styled from "styled-components";

const MOBILE_SEARCH_WIDTH = "280px";

// TODO: Replace with theme token
const breakpoint = {
  mobile: "480px",
};

export const DrilldownBarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.murv.spacing.s};
  padding: ${({ theme }) => `${theme.murv.spacing.s} ${theme.murv.spacing.xxxl}`};
  @media (max-width: ${breakpoint.mobile}) {
    padding: ${({ theme }) => `${theme.murv.spacing.s} ${theme.murv.spacing.l}`};
  }
`;

export const Line = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: ${({ theme }) => theme.murv.spacing.l};
`;

export const SearchWrapper = styled.div`
  width: ${MOBILE_SEARCH_WIDTH};
`;

export const SearchFeebackWrapper = styled.div`
  width: 100%;
  @media (max-width: ${breakpoint.mobile}) {
    width: ${MOBILE_SEARCH_WIDTH};
  }
`;

export const FilterBarWrapper = styled.div`
  flex: 1;
`;
