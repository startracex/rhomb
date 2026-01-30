import type { PropertyInit } from "./decorators/property.ts";

import { customElement } from "./decorators/custom-element.ts";
import { Delegate } from "./delegate.ts";
import { ReactiveDefinition } from "./internal/reactive-definition.ts";
import { Scheduler } from "./scheduler.ts";
import { Snapshot } from "./snapshot.ts";

export type ReactiveProperties<T = any> = {
  [K in keyof T]?: PropertyInit<T>;
};

export class RhombElement extends HTMLElement {
  static define<TThis extends typeof RhombElement>(
    this: TThis,
    name: string,
    _options?: ElementDefinitionOptions,
  ): typeof this {
    customElement(name, _options)(this);
    return this;
  }

  static properties: ReactiveProperties<RhombElement> = {};
  static attributes: Record<string, PropertyKey> = {};

  protected snapshot: Snapshot = new Snapshot();
  protected scheduler: Scheduler = new Scheduler({
    host: this,
    snapshot: this.snapshot,
  });
  protected delegate: Delegate = new Delegate({
    host: this,
    scheduler: this.scheduler,
    snapshot: this.snapshot,
    reactiveDefinition: ReactiveDefinition.load(this.constructor),
  });

  static get observedAttributes(): string[] {
    const rd = ReactiveDefinition.load(this);
    for (const { property } of rd.reactiveProperties) {
      Reflect.defineProperty(this.prototype, property, {
        get(this: RhombElement) {
          return this.delegate.getDelegateValue(property);
        },
        set(this: RhombElement, newValue: any) {
          return this.delegate.setDelegateValue(property, newValue);
        },
        enumerable: true,
        configurable: true,
      });
    }
    return rd.observedAttributes;
  }

  protected shadowRootInit: ShadowRootInit = {
    mode: "open",
  };

  connectedCallback(): void {
    this.delegate.connect();
    this.attachShadow(this.shadowRootInit);
  }

  disconnectedCallback(): void {
    this.delegate.disconnect();
  }

  adoptedCallback(): void {}

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    this.delegate.changeAttribute(name, oldValue, newValue);
  }

  requestUpdate(): Promise<void> {
    return this.scheduler.requestUpdate();
  }

  shouldUpdate(_changes: ReadonlyMap<PropertyKey, any>): boolean {
    return true;
  }

  update(_changes?: ReadonlyMap<PropertyKey, any>): void | Promise<void> {}

  get updateComplete(): Promise<void> {
    return this.scheduler.updateComplete;
  }

  get changedProperties(): ReadonlyMap<PropertyKey, any> {
    return this.snapshot.changes;
  }
}
