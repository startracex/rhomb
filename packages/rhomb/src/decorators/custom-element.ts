export const customElement = (tagName: string, options?: ElementDefinitionOptions) => {
  return (target: CustomElementConstructor): void => {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, target, options);
    }
  };
};
