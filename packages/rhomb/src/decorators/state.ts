import { property } from "./property.js";

export const state: typeof property = (propTypes) => {
  return property({
    attribute: false,
    ...propTypes,
  });
};
