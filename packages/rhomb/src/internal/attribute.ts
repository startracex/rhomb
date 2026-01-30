export const fromAttribute = (value: string | null, type: any): any => {
  if (!type || type === String) {
    return value ? String(value) : "";
  }
  if (type === Boolean) {
    return value !== null;
  }
  if (type === Number || type === BigInt) {
    return type(value);
  }
  if (type === Array || type === Object) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return new type(value);
};

export const toAttribute = (value: any, type: any): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (type === Boolean) {
    return value ? "" : null;
  }
  if (type === Array || type === Object) {
    return JSON.stringify(value);
  }
  return String(value);
};

export const normalizeAttribute = (
  attribute: string | boolean = true,
  property: PropertyKey,
): string | null => {
  if (attribute === true) {
    return String(property).toLowerCase();
  }
  return attribute || null;
};

export const removeAttribute = (
  element: Element,
  name: string,
  currentCheck?: boolean,
): boolean => {
  if (currentCheck) {
    if (!element.hasAttribute(name)) {
      return false;
    }
  }
  element.removeAttribute(name);
  return true;
};

export const setAttribute = (
  element: Element,
  name: string,
  value: string,
  currentCheck?: boolean,
): boolean => {
  if (currentCheck) {
    if (element.getAttribute(name) === value) {
      return false;
    }
  }
  element.setAttribute(name, value);
  return true;
};

export const updateAttribute = (
  element: Element,
  name: string,
  value: string | null,
  currentCheck?: boolean,
): boolean => {
  if (value === null) {
    return removeAttribute(element, name, currentCheck);
  }
  return setAttribute(element, name, String(value), currentCheck);
};
