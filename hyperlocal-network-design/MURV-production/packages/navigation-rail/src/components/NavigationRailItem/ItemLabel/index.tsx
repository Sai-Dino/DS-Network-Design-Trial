import React from "react";
import { IItemLabel } from "../../../types";
import {
  IconBlock,
  ItemLabelBlock,
  IconBadgeBlock,
  LabelBadgeBlock,
  RailItemLabel,
} from "./styles";

const ItemLabel: React.FC<IItemLabel> = ({
  label,
  badge,
  icon,
  disabled = false,
  selected = false,
}) => {
  let iconBadge;
  let labelBadge;

  if (icon) {
    iconBadge = (badge && <IconBadgeBlock>{badge}</IconBadgeBlock>) || null;
  } else if (!icon && label) {
    labelBadge = (badge && <LabelBadgeBlock>{badge}</LabelBadgeBlock>) || null;
  } else {
    labelBadge = null;
  }

  return (
    <ItemLabelBlock disabled={disabled} tabIndex={0} role="img">
      {icon && (
        <IconBlock selected={selected}>
          {icon}
          {iconBadge}
        </IconBlock>
      )}
      {label && (
        <>
          <RailItemLabel>{label}</RailItemLabel>
          {labelBadge}
        </>
      )}
    </ItemLabelBlock>
  );
};

export default ItemLabel;
