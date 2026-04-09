export const TABPANEL_VISIBILITY_TYPES = {
  EAGER_RENDER_HIDE_INACTIVE: "eager-render-and-hide-inactive",
  LAZY_RENDER_HIDE_INACTIVE: "lazy-render-and-hide-inactive",
  LAZY_RENDER_UNMOUNT_INACTIVE: "lazy-render-and-unmount-inactive",
} as const;

export const TAB_VARIANTS = {
  DEFAULT: "default",
  DYNAMIC: "dynamic",
} as const;
