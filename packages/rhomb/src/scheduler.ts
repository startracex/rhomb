import type { Snapshot } from "./snapshot.js";

interface SchedulerCallbacks {
  shouldUpdate?: (changes?: Map<PropertyKey, any>) => boolean;
  update: (changes?: Map<PropertyKey, any>) => Promise<void> | void;
}

export interface SchedulerInit {
  performable(): boolean;
  snapshot: Snapshot<PropertyKey, any>;
  callbacks: SchedulerCallbacks;
}

/**
 * Scheduler schedules property updates and rendering operations.
 * It ensures that the update operation is carried out at the right time
 * and avoids unnecessary repeated updates.
 */
export class Scheduler {
  updatePending = false;
  updateResolve: (() => void) | null = null;
  protected _updateComplete: Promise<void> | null = null;
  snapshot: Snapshot<PropertyKey, any>;
  callbacks: SchedulerCallbacks;
  performable?: () => boolean;

  constructor({ snapshot, callbacks, performable }: SchedulerInit) {
    this.snapshot = snapshot;
    this.callbacks = callbacks;
    this.performable = performable;
  }

  get updateComplete(): Promise<void> {
    return this._updateComplete || Promise.resolve();
  }

  requestUpdate(): Promise<void> {
    if (this.updatePending) {
      return this.updateComplete;
    }

    this.updatePending = true;
    this._updateComplete = new Promise((resolve) => {
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

  async performUpdate(): Promise<void> {
    if (this.performable && !this.performable()) {
      return;
    }

    const { changes } = this.snapshot;

    const shouldUpdate = this.callbacks.shouldUpdate?.(changes) ?? true;

    if (shouldUpdate) {
      await this.callbacks.update?.(changes);
      this.snapshot.commit();
    } else {
      this.snapshot.rollback();
    }
  }
}
