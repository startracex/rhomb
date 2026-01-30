import { expect, describe, it, vi, beforeEach } from "vitest";
import { RhombElement } from "../src/element.ts";

class TestElement extends RhombElement {
  update = vi.fn();
  shouldUpdate = vi.fn().mockReturnValue(true);
}

customElements.define("test-element", TestElement);

describe("Scheduler", () => {
  let element: TestElement;
  let scheduler: TestElement["scheduler"];
  let snapshot: TestElement["snapshot"];

  beforeEach(() => {
    element = new TestElement();
    // @ts-ignore
    scheduler = element.scheduler;
    // @ts-ignore
    snapshot = element.snapshot;
  });

  it("should return resolved promise when no update is pending", () => {
    expect(scheduler.updateComplete).toBeInstanceOf(Promise);
  });

  it("should not perform update when element is not connected", async () => {
    await scheduler.performUpdate();
    expect(element.update).not.toHaveBeenCalled();
  });

  it("should perform update when element is connected", async () => {
    document.body.replaceChildren(element);
    snapshot.update("test", "value");
    await scheduler.performUpdate();
    expect(element.update).toHaveBeenCalledWith(snapshot.changes);
    expect(snapshot.changes.size).toBe(0);
  });

  it("should preserve changes when shouldUpdate returns false", async () => {
    document.body.replaceChildren(element);
    element.shouldUpdate.mockReturnValue(false);
    snapshot.update("test", "value");
    await scheduler.performUpdate();
    expect(element.update).not.toHaveBeenCalled();
    expect(snapshot.get("test")).toBe("value");
  });

  it("should queue updates in microtasks", async () => {
    document.body.replaceChildren(element);
    const executionOrder: string[] = [];
    element.update.mockImplementation(() => {
      executionOrder.push("update");
    });

    scheduler.requestUpdate();
    executionOrder.push("after requestUpdate");

    await scheduler.updateComplete;
    executionOrder.push("after updateComplete");

    expect(executionOrder).toEqual(["after requestUpdate", "update", "after updateComplete"]);
  });

  it("should not queue multiple updates when one is pending", async () => {
    document.body.replaceChildren(element);
    let updateCount = 0;
    element.update.mockImplementation(() => {
      updateCount++;
    });

    const promise1 = scheduler.requestUpdate();
    const promise2 = scheduler.requestUpdate();

    await Promise.all([promise1, promise2]);
    expect(updateCount).toBe(1);
  });

  it("should handle async updates", async () => {
    document.body.replaceChildren(element);

    const asyncUpdate = vi
      .fn()
      .mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 10)));

    element.update = asyncUpdate;
    snapshot.update("test", "value");
    const updatePromise = scheduler.requestUpdate();
    expect(scheduler.updatePending).toBe(true);

    await updatePromise;
    expect(scheduler.updatePending).toBe(false);
    expect(asyncUpdate).toHaveBeenCalled();
  });

  it("should support multiple property updates before performing update", async () => {
    document.body.replaceChildren(element);
    snapshot.update("prop1", "value1");
    snapshot.update("prop2", "value2");

    await scheduler.performUpdate();
    expect(element.update).toHaveBeenCalledWith(snapshot.changes);
    expect(element.shouldUpdate).toHaveBeenCalledWith(snapshot.changes);
  });

  it("should maintain correct state after multiple update cycles", async () => {
    document.body.replaceChildren(element);

    // First update cycle
    snapshot.update("test1", "value1");
    await scheduler.requestUpdate();
    expect(snapshot.get("test1")).toBe("value1");

    // Second update cycle
    snapshot.update("test2", "value2");
    await scheduler.requestUpdate();
    expect(snapshot.get("test2")).toBe("value2");

    expect(element.update).toHaveBeenCalledTimes(2);
  });
});
