import styled from "styled-components";

interface ContentProps {
  width: number;
  height: number;
  spacing: number;
}
interface CarouselContainerProps {
  width: string;
}
export const CarouselContainer = styled.div<CarouselContainerProps>`
  display: flex;
  flex-direction: column-reverse;
  position: relative;
  min-width: ${(props) => props.width};
  overflow: hidden;
`;
export const ContentWindow = styled.div`
  display: flex;
  position: relative;
  width: 100%;
  transition: transform 0.5s ease-in-out;
`;

export const Content = styled.div<ContentProps>`
  width: ${(props) => `${props.width}px`};
  height: ${(props) => `${props.height}px`};
  margin: 0 ${(props) => `${props.spacing}px`};
  flex: 0 0 ${(props) => `${props.width}px`};
  border-radius: ${({ theme }) => theme.murv.spacing.s};
`;

export const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: ${({ theme }) => theme.murv.spacing.xl};
`;

export const SlideCounterContainer = styled.div`
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.murv.color.tag.category};
  font-size: ${({ theme }) => theme.murv.typography.body.s.size};
  padding: ${({ theme }) => theme.murv.spacing.s};
  margin: 0 3.6rem;
  border-radius: 50px;
  min-width: 50px;
  width: max-content;
`;

export const CustomButton = styled.button`
  display: flex;
  margin: 0;
  padding: 0;
  background-color: transparent;
  border: none;
  cursor: pointer;

  & .chevron-icon {
    color: #112ab8;
  }
`;

// Added these styles for storybook
export const CardImageContainer = styled.div`
  width: 340px;
  height: 240px;
  > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
export const CardBodyContainer = styled.div`
  width: 340px;
  height: 240px;
  border: 2px solid ${({ theme }) => theme.murv.color.stroke.primary};
`;
