export const generateId = () => (Math.random() + 1).toString(36).substring(7);

export const generateDialogHeaderId = (modalId: string) => `${modalId}-dialog-header`;

export const generateDialogContentId = (modalId: string) => `${modalId}-dialog-content`;
