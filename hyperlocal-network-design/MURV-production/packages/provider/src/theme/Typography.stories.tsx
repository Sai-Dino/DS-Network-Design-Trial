// ThemeCoreBase.stories.tsx
import React from "react";
import { Meta } from "@storybook/react";
import { ThemeCoreBase } from "./themeCore/base";
import {
  Container,
  GroupContainer,
  ColorGrid as Grid,
  GroupTitle,
  ColorBoxContainer as ItemContainer,
  Box,
  ColorName as Label,
} from "./styles";

const renderSpacing = (spacing) => (
  <Grid>
    {Object.keys(spacing).map((key) => (
      <ItemContainer key={key}>
        <Box width={spacing[key]} height={spacing[key]} borderRadius="0px" />
        <Label>{`${spacing[key]}`}</Label>
      </ItemContainer>
    ))}
  </Grid>
);

const renderRadius = (radius) => (
  <Grid>
    {Object.keys(radius).map((key) => (
      <ItemContainer key={key}>
        <Box borderRadius={radius[key]} />
        <Label>{`${key}: ${radius[key]}`}</Label>
      </ItemContainer>
    ))}
  </Grid>
);

const renderShadow = (shadow) => (
  <Grid>
    {Object.keys(shadow).map((key) => (
      <ItemContainer key={key}>
        <Box boxShadow={shadow[key]} />
        <Label>{`${key}: ${shadow[key]}`}</Label>
      </ItemContainer>
    ))}
  </Grid>
);

const renderZIndex = (zIndex) => (
  <Grid>
    {Object.keys(zIndex).map((key) => (
      <ItemContainer key={key}>
        <Box>
          <span style={{ zIndex: zIndex[key] }}>{zIndex[key]}</span>
        </Box>
        <Label>{`${key}`}</Label>
      </ItemContainer>
    ))}
  </Grid>
);

const renderOpacity = (opacity) => (
  <Grid>
    {Object.keys(opacity).map((key) => (
      <ItemContainer key={key}>
        <Box style={{ opacity: parseFloat(opacity[key]) / 100 }} />
        <Label>{`${key}: ${opacity[key]}`}</Label>
      </ItemContainer>
    ))}
  </Grid>
);

const renderStroke = (stroke) => (
  <Grid>
    {Object.keys(stroke).map((type) =>
      Object.keys(stroke[type]).map((key) => (
        <ItemContainer key={`${type}-${key}`}>
          <Box width="100px" height="100px" style={{ border: `${stroke[type][key]} ${type}` }} />
          <Label>{`${type}: ${stroke[type][key]}`}</Label>
        </ItemContainer>
      )),
    )}
  </Grid>
);

const renderFontWeight = (fontWeights) => (
  <Grid>
    {Object.keys(fontWeights).map((key) => (
      <ItemContainer key={key}>
        <Box>
          <span style={{ fontWeight: fontWeights[key], fontSize: "24px" }}>Aa</span>
        </Box>
        <Label>
          {key}: {fontWeights[key]}
        </Label>
      </ItemContainer>
    ))}
  </Grid>
);

const renderFontSize = (fontSizes) => (
  <Grid>
    {Object.keys(fontSizes).map((key) => (
      <ItemContainer key={key}>
        <Box>
          <span style={{ fontSize: fontSizes[key] }}>Aa</span>
        </Box>
        <Label>
          {key}: {fontSizes[key]}
        </Label>
      </ItemContainer>
    ))}
  </Grid>
);

const renderLetterSpacing = (letterSpacing) => (
  <Grid>
    {Object.keys(letterSpacing).map((key) => (
      <ItemContainer key={key}>
        <Box>
          <span style={{ letterSpacing: letterSpacing[key] }}>As much mud in the streets</span>
        </Box>
        <Label>
          {key}: {letterSpacing[key]}
        </Label>
      </ItemContainer>
    ))}
  </Grid>
);

const renderLineHeight = (lineHeight) => (
  <Grid>
    {Object.keys(lineHeight).map((key) => (
      <ItemContainer key={key}>
        <Box width={lineHeight[key]} height={lineHeight[key]} borderRadius="0px">
          <span style={{ lineHeight: lineHeight[key], fontSize: "12px" }}>Aa</span>
        </Box>
        <Label>
          {key}: {lineHeight[key]}
        </Label>
      </ItemContainer>
    ))}
  </Grid>
);

export default {
  title: "Theme/Core",
  component: Container,
} as Meta;

export const TypographyTokens = () => (
  <Container>
    <GroupContainer>
      <GroupTitle>Typography Weight</GroupTitle>
      {renderFontWeight(ThemeCoreBase.typography.weight)}
    </GroupContainer>
    <GroupContainer>
      <GroupTitle>Typography Size</GroupTitle>
      {renderFontSize(ThemeCoreBase.typography.size)}
    </GroupContainer>
    <GroupContainer>
      <GroupTitle>Typography Letter Spacing</GroupTitle>
      {renderLetterSpacing(ThemeCoreBase.typography.letterSpacing)}
    </GroupContainer>
    <GroupContainer>
      <GroupTitle>Typography Line Height</GroupTitle>
      {/* {renderTypography(ThemeCoreBase.typography.lineHeight, 'line-height')} */}
      {renderLineHeight(ThemeCoreBase.typography.lineHeight)}
    </GroupContainer>
    <GroupContainer>
      <GroupTitle>Spacing</GroupTitle>
      {renderSpacing(ThemeCoreBase.spacing)}
    </GroupContainer>
    <GroupContainer>
      <GroupTitle>Border Radius</GroupTitle>
      {renderRadius(ThemeCoreBase.radius)}
    </GroupContainer>
    <GroupContainer>
      <GroupTitle>Box Shadow</GroupTitle>
      {renderShadow(ThemeCoreBase.shadow)}
    </GroupContainer>
    <GroupContainer>
      <GroupTitle>Z Index</GroupTitle>
      {renderZIndex(ThemeCoreBase.zIndex)}
    </GroupContainer>
    <GroupContainer>
      <GroupTitle>Opacity</GroupTitle>
      {renderOpacity(ThemeCoreBase.opacity)}
    </GroupContainer>
    <GroupContainer>
      <GroupTitle>Stroke</GroupTitle>
      {renderStroke(ThemeCoreBase.stroke)}
    </GroupContainer>
  </Container>
);
