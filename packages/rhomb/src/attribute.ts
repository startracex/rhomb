export const fromAttribute = (value: string | null, type: any): any => {
  if (type === Boolean) {
    if (value === null || value === "false") {
      return false;
    }
    return true;
  }
  if (type === Number) {
    return Number(value);
  }
  if (type === Array || type === Object) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

export const toAttribute = (value: any, type: any): string | null => {
  if (type === Array || type === Object) {
    return JSON.stringify(value);
  }
  if (value === false || value === null) {
    return null;
  }
  if (value === true) {
    return "";
  }
  return String(value);
};

export const normalizeAttribute = (attribute: string | boolean, property: PropertyKey): string | undefined => {
  if (attribute === true || attribute === undefined) {
    return String(property).toLowerCase();
  }
  if (attribute) {
    return attribute;
  }
};

const noAttribute = (value: any): boolean => value === null || value === undefined || value === false;

const removeAttribute = (element: Element, name: string, currentCheck?: boolean): void => {
  if (currentCheck && !element.hasAttribute(name)) {
    return;
  }
  element.removeAttribute(name);
};

const setAttribute = (element: Element, name: string, value: any, currentCheck?: boolean) => {
  if (currentCheck) {
    const current = element.getAttribute(name);
    if (current !== null && current === value) {
      return;
    }
  }
  element.setAttribute(name, value);
};

export const updateAttribute = (element: Element, name: string, value: any, currentCheck?: boolean): void => {
  if (noAttribute(value)) {
    removeAttribute(element, name, currentCheck);
    return;
  }
  setAttribute(element, name, value === true ? "" : String(value), currentCheck);
};
