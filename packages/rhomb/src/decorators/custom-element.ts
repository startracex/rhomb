export const customElement = (tagName: string, options?: ElementDefinitionOptions) => {
  return (target: typeof HTMLElement): void => {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, target, options);
    }
  };
};
