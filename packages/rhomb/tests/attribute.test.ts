import { describe, it, expect } from "vitest";
import { fromAttribute, toAttribute, normalizeAttribute } from "../src/internal/attribute.ts";

describe("fromAttribute", () => {
  it("should return empty string value for null when type is Boolean", () => {
    expect(fromAttribute(null, String)).toBe("");
  });

  it("should return string value for any other value when type is String", () => {
    expect(fromAttribute("some string", String)).toBe("some string");
  });

  it("should return false for null when type is Boolean", () => {
    expect(fromAttribute(null, Boolean)).toBe(false);
  });

  it("should return true for any other value when type is Boolean", () => {
    expect(fromAttribute("some string", Boolean)).toBe(true);
  });

  it("should return a number when type is Number", () => {
    expect(fromAttribute("123", Number)).toBe(123);
    expect(fromAttribute("-456", Number)).toBe(-456);
    expect(fromAttribute("3.1", Number)).toBe(3.1);
    expect(fromAttribute("not a number", Number)).toBeNaN();
  });

  it("should return a parsed JSON object when type is Array or Object", () => {
    expect(fromAttribute(JSON.stringify([1, 2, 3]), Array)).toEqual([1, 2, 3]);
    expect(fromAttribute(JSON.stringify({ a: 1, b: 2 }), Object)).toEqual({ a: 1, b: 2 });
  });

  it("should return null if parsing fails for Array or Object", () => {
    expect(fromAttribute("invalid json", Object)).toBe(null);
  });
});

describe("toAttribute", () => {
  it("should return a JSON string when type is Array or Object", () => {
    expect(toAttribute([1, 2, 3], Array)).toBe(JSON.stringify([1, 2, 3]));
    expect(toAttribute({ a: 1, b: 2 }, Object)).toBe(JSON.stringify({ a: 1, b: 2 }));
  });

  it("should return null for false or null", () => {
    expect(toAttribute(false, Boolean)).toBe(null);
    expect(toAttribute(null, String)).toBe(null);
  });

  it('should return "" for true', () => {
    expect(toAttribute(true, Boolean)).toBe("");
  });

  it("should return null for false and null", () => {
    expect(toAttribute(false, Boolean)).toBe(null);
    expect(toAttribute(null, String)).toBe(null);
  });

  it("should return a string representation for other values", () => {
    expect(toAttribute(1, Number)).toBe("1");
    class A {
      toString() {
        return "a";
      }
    }
    expect(toAttribute(new A(), undefined)).toBe("a");
  });
});

describe("normalizeAttribute", () => {
  it("should normalize attribute names correctly", () => {
    expect(normalizeAttribute(true, "myProp")).toBe("myprop");
    expect(normalizeAttribute("my-prop", "myProp")).toBe("my-prop");
    expect(normalizeAttribute(undefined, "myProp")).toBe("myprop");
    expect(normalizeAttribute(false, "myProp")).toBeFalsy();
  });
});
