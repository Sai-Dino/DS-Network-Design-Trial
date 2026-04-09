export const generateRandomId = () =>
  Math.floor(Math.random() * Date.now() + Math.random()).toString(16);
