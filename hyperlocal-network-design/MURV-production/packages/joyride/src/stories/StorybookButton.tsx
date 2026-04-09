import React from "react";

export const StorybookButton = ({
  primary,
  backgroundColor,
  size,
  label,
  className,
  ...props
}: any) => {
  const mode = primary ? "storybook-button--primary" : "storybook-button--secondary";
  return (
    <button
      type="button"
      className={["storybook-button", `storybook-button--${size}`, mode, className].join(" ")}
      style={backgroundColor && { backgroundColor }}
      {...props}
    >
      {label}
    </button>
  );
};
