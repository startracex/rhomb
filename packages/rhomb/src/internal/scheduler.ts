import type { RhombElement } from "../element.ts";
import type { Snapshot } from "./snapshot.ts";

export interface SchedulerInit {
  snapshot: Snapshot<PropertyKey, any>;
  host: RhombElement;
}

/**
 * Scheduler schedules property updates and rendering operations.
 * It ensures that the update operation is carried out at the right time
 * and avoids unnecessary repeated updates.
 */
export class Scheduler {
  updatePending = false;
  updateResolve: (() => void) | null = null;
  updateComplete: Promise<void> | null = Promise.resolve();

  requestUpdate(): Promise<void> {
    if (this.updatePending) {
      return this.updateComplete;
    }

    this.updatePending = true;

    this.updateComplete = new Promise((resolve) => {
      this.updateResolve = resolve;
    });

    queueMicrotask(() => {
      this.performUpdate().finally(() => {
        this.updatePending = false;
        this.updateResolve?.();
        this.updateResolve = null;
      });
    });

    return this.updateComplete;
  }

  snapshot: Snapshot<PropertyKey, any>;
  host: RhombElement;

  constructor({ snapshot, host }: SchedulerInit) {
    this.snapshot = snapshot;
    this.host = host;
  }

  async performUpdate(): Promise<void> {
    if (!this.host.isConnected) {
      return;
    }

    const { changes } = this.snapshot;
    const shouldUpdate = this.host.shouldUpdate(changes) ?? true;

    if (!shouldUpdate) {
      return;
    }
    await this.host.update(changes);
    this.snapshot.commit();
  }
}
