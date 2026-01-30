import type { PropertyDefinition, ReactiveDefinition } from "./internal/reactive-definition.ts";
import type { RhombElement } from "./element.ts";
import type { Scheduler } from "./scheduler.ts";
import type { Snapshot } from "./snapshot.ts";

import { updateAttribute } from "./attribute.ts";

export interface DelegateInit {
  host: RhombElement;
  scheduler: Scheduler;
  snapshot: Snapshot;
  reactiveDefinition: ReactiveDefinition;
}

/**
 * Delegate is used for the value of proxy properties and reflects it to element attributes.
 */
export class Delegate {
  protected reactiveDefinition: ReactiveDefinition;
  protected scheduler: Scheduler;
  protected snapshot: Snapshot;
  protected host: RhombElement;
  protected values = {};
  protected reflecting: boolean;
  protected isConnected = false;

  constructor({ host, scheduler, snapshot, reactiveDefinition }: DelegateInit) {
    this.scheduler = scheduler;
    this.snapshot = snapshot;
    this.host = host;
    this.reactiveDefinition = reactiveDefinition;
  }

  connect() {
    if (this.isConnected) {
      return;
    }
    this.isConnected = true;
    for (const config of this.reactiveDefinition.reactiveProperties) {
      const { attribute, property } = config;
      if (attribute) {
        const attributeValue = this.host.getAttribute(attribute);
        let value =
          attributeValue !== null
            ? this.fromAttribute(config, attributeValue)
            : this.getTargetValue(property);

        this.setDelegateValue(property, value);
      }

      // this.defineProperty(config);
      this.reflect(config);
    }
  }

  disconnect() {
    this.isConnected = false;
  }

  /**
   * Reactive properties have been defined on prototype,
   * called by standard field decorator.
   */
  defineProperty(config: PropertyDefinition): boolean {
    return Reflect.defineProperty(this.host, config.property, {
      get: () => this.getDelegateValue(config.property),
      set: (newValue: any): void => this.setDelegateValue(config.property, newValue),
      enumerable: true,
      configurable: true,
    });
  }

  reflect(config: PropertyDefinition): void {
    if (!config.reflect || !this.host.isConnected) {
      return;
    }
    this.reflecting = true;

    const { attribute } = config;
    if (!attribute) {
      return;
    }
    const value = this.getDelegateValue(config.property);
    const attributeValue = this.toAttribute(config, value);
    updateAttribute(this.host, attribute, attributeValue);
    this.reflecting = false;
  }

  changeAttribute(name: string, oldValue: string | null, newValue: string | null): void {
    if (newValue === oldValue || this.reflecting || !this.host.isConnected) {
      return;
    }
    const delegate = this.reactiveDefinition.loadAttribute(name);
    if (!delegate) {
      return;
    }
    const newProperty = this.fromAttribute(delegate, newValue);
    this.setTargetValue(delegate.property, newProperty);
  }

  getDelegateValue(property: PropertyKey): any {
    return this.values[property];
  }

  setDelegateValue(property: PropertyKey, newValue: any): void {
    const config = this.reactiveDefinition.loadProperty(property);
    if (!config) {
      return;
    }
    const { descriptor, hasChanged } = config;
    const oldValue = this.getDelegateValue(property);
    if (!hasChanged(oldValue, newValue)) {
      return;
    }
    /* if descriptor has setter, call setter when value changed */
    descriptor.set?.call(this.host, newValue);
    this.values[property] = newValue;
    this.snapshot.update(property, newValue);
    this.reflect(config);
    this.scheduler.requestUpdate();
  }

  protected fromAttribute(config: PropertyDefinition, value: string | null): any {
    return config.fromAttribute.call(this.host, value, config.type);
  }

  protected toAttribute(config: PropertyDefinition, value: any): string | null {
    return config.toAttribute.call(this.host, value, config.type);
  }

  protected getTargetValue(property: PropertyKey): any {
    return this.host[property];
  }

  protected setTargetValue(property: PropertyKey, value: any): void {
    this.host[property] = value;
  }
}
