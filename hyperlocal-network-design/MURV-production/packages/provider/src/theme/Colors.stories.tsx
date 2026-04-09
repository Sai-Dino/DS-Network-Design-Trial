// ThemeCoreColors.stories.tsx
import React from "react";
import { Meta } from "@storybook/react";
import { ThemeCoreColors } from "./themeCore/colors"; // Adjust the path as needed
import { IThemeCore } from "./types";
import {
  ColorBoxContainer,
  ColorGrid,
  ColorHex,
  ColorName,
  Box,
  Container,
  GroupContainer,
  GroupTitle,
} from "./styles";

const ColorBox = ({ color, name }: { color: string; name: string }) => (
  <ColorBoxContainer>
    <Box bgColor={color} />
    <ColorName>{name}</ColorName>
    <ColorHex>{color}</ColorHex>
  </ColorBoxContainer>
);

const ColorGroup = ({
  groupName,
  colors,
}: {
  groupName: string;
  colors: IThemeCore["color"][string];
}) => (
  <GroupContainer>
    <GroupTitle>{groupName}</GroupTitle>
    <ColorGrid>
      {Object.keys(colors).map((key) => (
        <ColorBox key={key} color={colors[key]} name={`${groupName} ${key}`} />
      ))}
    </ColorGrid>
  </GroupContainer>
);

export default {
  title: "Theme/Core",
  component: ColorGroup,
} as Meta;

export const Colors = () => (
  <Container>
    {Object.keys(ThemeCoreColors).map((groupName) => (
      <ColorGroup key={groupName} groupName={groupName} colors={ThemeCoreColors[groupName]} />
    ))}
  </Container>
);
