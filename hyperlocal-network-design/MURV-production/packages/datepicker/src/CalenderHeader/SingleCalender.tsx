import React from "react";
import { Button } from "@murv/button";
import { ArrowDropDown } from "@murv/icons";
import { HeaderContainer, TextLabel } from "./styles";
import { IHeaderLabelText, ISingleCalendarHeader } from "../types";

export const SimpleTextLabel = ({
  month,
  year,
  textLabels = [],
  interfix,
}: Partial<IHeaderLabelText>) =>
  textLabels.length ? (
    <TextLabel>{`${textLabels.join(interfix)}`}</TextLabel>
  ) : (
    <TextLabel>{`${month} ${year}`}</TextLabel>
  );

const DropDownIcon = () => <ArrowDropDown type="sharp" />;

const SingleCalenderHeader: React.FC<ISingleCalendarHeader> = ({
  month,
  year,
  subType,
  handleHeaderCallback,
}) => {
  if (subType === "SIMPLE") {
    return (
      <HeaderContainer aria-live="polite">
        <SimpleTextLabel {...{ month, year, subType }} />
      </HeaderContainer>
    );
  }
  if (subType === "ADVANCED") {
    return (
      <HeaderContainer>
        <Button
          buttonStyle="neutral"
          buttonType="tertiary"
          onClick={() => handleHeaderCallback && handleHeaderCallback("MONTH")}
          SuffixIcon={DropDownIcon}
        >
          {month}
        </Button>
        <Button
          buttonStyle="neutral"
          buttonType="tertiary"
          onClick={() => handleHeaderCallback && handleHeaderCallback("YEAR")}
          SuffixIcon={DropDownIcon}
        >
          {year}
        </Button>
      </HeaderContainer>
    );
  }
  return null;
};

export default SingleCalenderHeader;
