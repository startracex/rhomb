import { expect, describe, it, vi, beforeEach, Mock } from "vitest";
import { Scheduler } from "../src/scheduler";
import { Snapshot } from "../src/snapshot";

describe("Scheduler", () => {
  let snapshot: Snapshot;
  let updateMock: Mock;
  let shouldUpdateMock: Mock;
  let isConnectedMock: Mock;
  let scheduler: Scheduler;

  beforeEach(() => {
    snapshot = new Snapshot();
    updateMock = vi.fn();
    shouldUpdateMock = vi.fn().mockReturnValue(true);
    isConnectedMock = vi.fn().mockReturnValue(true);

    scheduler = new Scheduler({
      snapshot,
      callbacks: {
        update: updateMock,
        shouldUpdate: shouldUpdateMock,
      },
      performable: isConnectedMock,
    });
  });

  it("should return resolved promise when no update is pending", () => {
    expect(scheduler.updateComplete).toBeInstanceOf(Promise);
  });

  it("should not perform update when performable", async () => {
    isConnectedMock.mockReturnValue(false);
    await scheduler.performUpdate();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("should perform update when no performable", async () => {
    snapshot.update("test", "value");
    await scheduler.performUpdate();
    expect(updateMock).toHaveBeenCalledWith(snapshot.changes);
    expect(snapshot.changes.size).toBe(0);
  });

  it("should rollback changes when shouldUpdate returns false", async () => {
    shouldUpdateMock.mockReturnValue(false);
    snapshot.update("test", "value");
    await scheduler.performUpdate();
    expect(updateMock).not.toHaveBeenCalled();
    expect(snapshot.get("test")).toBe(undefined);
  });

  it("should queue updates in microtasks", async () => {
    const executionOrder: string[] = [];
    updateMock.mockImplementation(() => {
      executionOrder.push("update");
    });

    scheduler.requestUpdate();
    executionOrder.push("after requestUpdate");

    await scheduler.updateComplete;
    executionOrder.push("after updateComplete");

    expect(executionOrder).toEqual(["after requestUpdate", "update", "after updateComplete"]);
  });

  it("should not queue multiple updates when one is pending", async () => {
    let updateCount = 0;
    updateMock.mockImplementation(() => {
      updateCount++;
    });

    const promise1 = scheduler.requestUpdate();
    const promise2 = scheduler.requestUpdate();

    await Promise.all([promise1, promise2]);
    expect(updateCount).toBe(1);
  });

  it("should handle async updates", async () => {
    const asyncUpdate = vi.fn().mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 10)));

    scheduler = new Scheduler({
      snapshot,
      callbacks: {
        update: asyncUpdate,
        shouldUpdate: shouldUpdateMock,
      },
      performable: isConnectedMock,
    });

    snapshot.update("test", "value");
    const updatePromise = scheduler.requestUpdate();
    expect(scheduler.updatePending).toBe(true);

    await updatePromise;
    expect(scheduler.updatePending).toBe(false);
    expect(asyncUpdate).toHaveBeenCalled();
  });

  it("should support multiple property updates before performing update", async () => {
    snapshot.update("prop1", "value1");
    snapshot.update("prop2", "value2");

    await scheduler.performUpdate();
    expect(updateMock).toHaveBeenCalledWith(snapshot.changes);
    expect(shouldUpdateMock).toHaveBeenCalledWith(snapshot.changes);
  });

  it("should maintain correct state after multiple update cycles", async () => {
    // First update cycle
    snapshot.update("test1", "value1");
    await scheduler.requestUpdate();
    expect(snapshot.get("test1")).toBe("value1");

    // Second update cycle
    snapshot.update("test2", "value2");
    await scheduler.requestUpdate();
    expect(snapshot.get("test2")).toBe("value2");

    expect(updateMock).toHaveBeenCalledTimes(2);
  });
});
