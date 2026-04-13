// StarIcon.tsx
import React from "react";

const StarIcon: React.FC<{ isSelected: boolean; role: string }> = ({ isSelected, role }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={isSelected ? "orange" : "none"}
    stroke="gold"
    strokeLinecap="round"
    strokeLinejoin="round"
    role={role}
  >
    <path d="M12 2L14.65 8.54L22 9.24L17 14.14L18.79 21.07L12 17.5L5.21 21.07L7 14.14L2 9.24L9.35 8.54L12 2z" />
  </svg>
);

export default StarIcon;
