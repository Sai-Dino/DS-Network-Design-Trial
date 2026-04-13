import { Color, Weight } from "../baseTypes";

// figure out how to make this an interface
type ICoreColor<T> = {
  // using exclude here as removed items are less than included
  // but ideally this should be Extract
  // coz if any new weights are added and not excludede here
  // then its a bug and types would fail
  // but in extract we have to mention every key
  // so assumption is weights dont change tht much to justify using Extract here
  [Key in Exclude<Weight, T>]: Color;
};

export interface ICoreColors {
  grey: ICoreColor<150 | 250 | 650 | 950>;
  mustard: ICoreColor<0 | 75 | 150 | 250 | 350 | 450 | 550 | 650 | 750 | 850 | 950 | 1000>;
  magenta: ICoreColor<0 | 75 | 150 | 250 | 350 | 450 | 550 | 650 | 750 | 850 | 950 | 1000>;
  teal: ICoreColor<0 | 75 | 150 | 250 | 350 | 450 | 550 | 650 | 750 | 850 | 950 | 1000>;
  green: ICoreColor<0 | 150 | 750 | 850 | 1000>;
  purple: ICoreColor<0 | 75 | 150 | 250 | 350 | 450 | 550 | 650 | 750 | 850 | 950 | 1000>;
  blue: ICoreColor<0 | 75 | 150 | 250 | 350 | 450 | 550 | 650 | 750 | 850 | 950 | 1000>;
  vividblue: ICoreColor<0 | 50 | 100 | 200 | 300 | 400 | 450 | 500 | 600 | 650 | 700 | 750 | 800 | 850 | 900>;
  red: ICoreColor<0 | 450 | 650 | 750 | 850>;
  yellow: ICoreColor<0 | 150 | 350 | 650 | 750 | 850 | 950 | 1000>;
  yellowgreen: ICoreColor<0 | 50 | 75 | 100 | 150 | 200 | 250 | 300 | 350 | 400 | 450 | 550 | 600 | 650 | 700 | 750 | 800 | 850 | 900 | 950 | 1000>;
  pink: ICoreColor<0 | 50 | 75 | 100 | 150 | 200 | 250 | 300 | 350 | 400 | 450 | 550 | 600 | 650 | 700 | 750 | 800 | 850 | 900 | 950 | 1000>;
  warmgrey: ICoreColor<0 | 50 | 75 | 100 | 150 | 200 | 250 | 350 | 450 | 550 | 650 | 750 | 800 | 850 | 900 | 950 | 1000>
}
