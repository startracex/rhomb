import { describe, it, expect } from "vitest";
import { fromAttribute, toAttribute, normalizeAttribute } from "../src/attribute";

describe("fromAttribute", () => {
  it('should return false for null or "false" when type is Boolean', () => {
    expect(fromAttribute(null, Boolean)).toBe(false);
    expect(fromAttribute("false", Boolean)).toBe(false);
  });

  it("should return true for any other value when type is Boolean", () => {
    expect(fromAttribute("true", Boolean)).toBe(true);
    expect(fromAttribute("some string", Boolean)).toBe(true);
    expect(fromAttribute("false", Boolean)).toBe(false);
  });

  it("should return a number when type is Number", () => {
    expect(fromAttribute("123", Number)).toBe(123);
    expect(fromAttribute("-456", Number)).toBe(-456);
    expect(fromAttribute("3.1", Number)).toBe(3.1);
    // NaN
    expect(fromAttribute("not a number", Number)).toBeNaN();
  });

  it("should return a parsed JSON object when type is Array or Object", () => {
    expect(fromAttribute("[1, 2, 3]", Array)).toEqual([1, 2, 3]);
    expect(fromAttribute('{"a": 1, "b": 2}', Object)).toEqual({ a: 1, b: 2 });
  });

  it("should return the original value if parsing fails for Array or Object", () => {
    expect(fromAttribute("invalid json", Object)).toBe("invalid json");
  });

  it("should return the original value for other types", () => {
    expect(fromAttribute("test string", String)).toBe("test string");
    expect(fromAttribute(null, String)).toBe(null);
  });
});

describe("toAttribute", () => {
  it("should return a JSON string when type is Array or Object", () => {
    expect(toAttribute([1, 2, 3], Array)).toBe("[1,2,3]");
    expect(toAttribute({ a: 1, b: 2 }, Object)).toBe('{"a":1,"b":2}');
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
    expect(toAttribute("string", String)).toBe("string");
    expect(toAttribute(undefined, String)).toBe("undefined");
  });
});

describe("normalizeAttribute", () => {
  it("should normalize attribute names correctly", () => {
    expect(normalizeAttribute(true, "myProp")).toBe("myprop");
    expect(normalizeAttribute("my-prop", "myProp")).toBe("my-prop");
    expect(normalizeAttribute(undefined, "myProp")).toBe("myprop");
    expect(normalizeAttribute(false, "myProp")).toBe(undefined);
  });
});
