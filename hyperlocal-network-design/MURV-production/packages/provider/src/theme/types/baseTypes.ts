type HexaNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type HexaLetter = "A" | "B" | "C" | "D" | "E" | "F" | "a" | "b" | "c" | "d" | "e" | "f";
type HexaChar = HexaLetter | HexaNumber;

export type Color = `#${string}`;

export type ColorWithOpacity = `${Color}${HexaChar}${HexaChar}`;

export type PixelUnit = "px" | "rem";

export type SpaceUnit<T = number, Y = PixelUnit> = `${number & T}${string & Y}`;

export type SizeUnit = 0 | "xxxs" | "xxs" | "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl";

export type ScaleUnit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;

export type State = "default" | "hover" | "pressed";

export type Weight = 0 | 50 | 75 | 100 | 150 | 200 | 250 | 300 | 350 | 400 | 450 | 500 | 550 | 600 | 650 | 700 | 750 | 800 | 850 | 900 | 950 | 1000;

export type Intent =
  | "primary"
  | "secondary"
  | "accent"
  | "neutral"
  | "brand"
  | "brandlight"
  | "information"
  | "inverse"
  | "success"
  | "warning"
  | "danger"
  | "dangerlight"
  | "selected"
  | "disabled"
  | "input"
  | "subtle";

export type Tag = "promotion" | "saving" | "combo" | "category" | "recommended"

export type Percent = `${number}%`;
