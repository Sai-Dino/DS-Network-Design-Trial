import styled from 'styled-components';

export const TileBarContainer = styled.div<{ gap: string }>`
    display: flex;
    align-items: center;
    width: '100wh';
    flex-wrap: wrap;
    overflow: auto;
    gap: ${prop => prop.gap};
    scrollbar-width: none;
    -ms-overflow-style: none;

    ::-webkit-scrollbar {
        width: 0;
        height: 0;
        background-color: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background-color: rgb(0, 0, 0, 0.2);
        border-radius: 4px;
    }
`;
