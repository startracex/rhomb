import { property } from "./property.ts";

export const state: typeof property = (propTypes) => {
  return property({
    attribute: false,
    ...propTypes,
  });
};
