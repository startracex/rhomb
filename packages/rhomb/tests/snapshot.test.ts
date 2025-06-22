import { expect, describe, it } from "vitest";
import { Snapshot } from "../src/snapshot";

describe("Snapshot", () => {
  it("should get values correctly", () => {
    const snapshot = new Snapshot([["key", "value"]]);
    expect(snapshot.get("key")).toBe("value");
    expect(snapshot.get("nonexistent")).toBe(undefined);
  });

  it("should update values and track changes", () => {
    const snapshot = new Snapshot([["key", "initial"]]);
    snapshot.update("key", "updated");
    expect(snapshot.get("key")).toBe("updated");
    expect(snapshot.changes.get("key")).toBe("updated");
    expect(snapshot.previous.get("key")).toBe("initial");
  });

  it("should commit changes correctly", () => {
    const snapshot = new Snapshot([["key", "initial"]]);
    snapshot.update("key", "updated");
    snapshot.commit();

    expect(snapshot.current.get("key")).toBe("updated");
    expect(snapshot.previous.get("key")).toBe("updated");
    expect(snapshot.changes.size).toBe(0);
  });

  it("should rollback changes correctly", () => {
    const snapshot = new Snapshot([["key", "initial"]]);
    snapshot.update("key", "updated");
    snapshot.rollback();

    expect(snapshot.current.get("key")).toBe("initial");
    expect(snapshot.previous.get("key")).toBe("initial");
    expect(snapshot.changes.size).toBe(0);
  });

  it("should handle multiple updates before commit", () => {
    const snapshot = new Snapshot([["key", "initial"]]);
    snapshot.update("key", "update1");
    snapshot.update("key", "update2");

    expect(snapshot.get("key")).toBe("update2");
    expect(snapshot.changes.get("key")).toBe("update2");
    expect(snapshot.previous.get("key")).toBe("initial");
  });

  it("should handle updates with different types", () => {
    const snapshot = new Snapshot<string, any>();
    snapshot.update("numberKey", 123);
    snapshot.update("booleanKey", true);
    snapshot.update("objectKey", { test: "value" });

    expect(snapshot.get("numberKey")).toBe(123);
    expect(snapshot.get("booleanKey")).toBe(true);
    expect(snapshot.get("objectKey")).toEqual({ test: "value" });
  });

  it("should handle undefined and null values", () => {
    const snapshot = new Snapshot<string, any>();
    snapshot.update("undefinedKey", undefined);
    snapshot.update("nullKey", null);

    expect(snapshot.get("undefinedKey")).toBe(undefined);
    expect(snapshot.get("nullKey")).toBe(null);
  });
});
