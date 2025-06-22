import { normalizeAttribute, fromAttribute, toAttribute, updateAttribute } from "./attribute.js";
import type { ReactivePropertyInit } from "./decorators/property.js";
import type { Scheduler } from "./scheduler.js";

export interface DelegateClient {
  property: PropertyKey;
  attribute: string;
  config: ReactivePropertyInit;
}

export interface DelegateInit {
  target: HTMLElement;
  scheduler: Scheduler;
}

/**
 * Delegate manages the access and update of property and the mapping to html properties,
 * initializes properties and defines accessors and setters for properties,
 * reflecting and updating when properties change.
 */
export abstract class Delegate<C extends DelegateClient = DelegateClient> {
  properties: Map<PropertyKey, C> = new Map();
  attributes: Map<string, C> = new Map();
  scheduler: Scheduler;
  target: Element;

  constructor({ target, scheduler }: DelegateInit) {
    this.target = target;
    this.scheduler = scheduler;
  }

  add(propertyName: PropertyKey, config: ReactivePropertyInit): void {
    const delegate = this.initializeProperty(propertyName, config);
    this.defineProperty(delegate);
    this.reflectProperty(delegate);
  }

  initializeProperty(propertyName: PropertyKey, config: ReactivePropertyInit): C {
    const attributeName = normalizeAttribute(config.attribute, propertyName);
    const delegate = {
      attribute: attributeName,
      property: propertyName,
      config,
    } as C;
    this.initialDelegateValue(delegate);
    this.properties.set(propertyName, delegate);
    if (attributeName) {
      this.attributes.set(attributeName, delegate);
      const attributeValue = this.target.getAttribute(attributeName);
      if (attributeValue !== null) {
        const newValue = this._fromAttribute(delegate, attributeValue);
        this.setDelegateValue(delegate, newValue);
      }
    }
    return delegate;
  }

  defineProperty(delegate: C): boolean {
    const { config, property: propertyName } = delegate;
    return Reflect.defineProperty(this.target, propertyName, {
      get: this.createGetter(delegate),
      set: this.createSetter(delegate),
      enumerable: config.descriptor?.enumerable ?? true,
      configurable: true,
    });
  }

  createGetter(delegate: C): () => any {
    return delegate.config.descriptor?.get ?? (() => this.getDelegateValue(delegate));
  }

  createSetter(delegate: C): (newValue: any) => void {
    return (newValue: any): void => {
      const oldValue = this.getDelegateValue(delegate);
      const { config, property: propertyName } = delegate;
      const hasChanged = config?.hasChanged || ((v1, v2) => !Object.is(v1, v2));
      if (hasChanged(oldValue, newValue)) {
        this.reflecting = true;
        this.setDelegateValue(delegate, newValue);
        this.scheduler.snapshot.update(propertyName as any, newValue);
        this.reflectProperty(delegate);
        config?.descriptor?.set?.call(this.target, newValue);
        this.scheduler.requestUpdate();
        this.reflecting = false;
      }
    };
  }

  reflecting: boolean;
  reflectProperty(delegate: C): void {
    const { config, property: propertyName } = delegate;
    if (config?.reflect) {
      const attributeName = normalizeAttribute(config.attribute, propertyName);
      if (!attributeName) {
        return;
      }
      let attributeValue: string;
      if (typeof config.reflect === "function") {
        const canSet: boolean = config.reflect.call(this.target);
        if (!canSet) {
          return;
        }
      }
      const value = this.getDelegateValue(delegate);
      attributeValue = this._toAttribute(delegate, value);
      updateAttribute(this.target, attributeName, attributeValue, true);
    }
  }

  protected _fromAttribute(delegate: C, value: string): any {
    const fromAttributeFn = delegate.config.fromAttribute ?? fromAttribute;
    return fromAttributeFn.call(this.target, value, delegate.config.type);
  }

  protected _toAttribute({ config }: C, value: any): string {
    const toAttributeFn = config.toAttribute ?? toAttribute;
    return toAttributeFn.call(this.target, value, config.type);
  }

  setAttribute(name: string, newValue: string): void {
    if (this.reflecting || !this.target.isConnected) {
      return;
    }
    const delegate = this.attributes.get(name);
    if (!delegate) {
      return;
    }
    const newProperty = this._fromAttribute(delegate, newValue);
    this.setTargetValue(delegate.property, newProperty);
  }

  getTargetValue(propertyKey: PropertyKey): any {
    return Reflect.get(this.target, propertyKey);
  }

  setTargetValue(propertyKey: PropertyKey, value: any): boolean {
    return Reflect.set(this.target, propertyKey, value);
  }

  abstract getDelegateValue(delegate: C): any;

  abstract setDelegateValue(delegate: C, value: any): void;

  initialDelegateValue(delegate: C): void {
    const value = this.getTargetValue(delegate.property);
    this.setDelegateValue(delegate, value);
  }
}

export class DefaultDelegate<C extends DelegateClient & { value: any }> extends Delegate<C> {
  getDelegateValue(delegate: C): any {
    return delegate.value;
  }
  setDelegateValue(delegate: C, value: any): void {
    delegate.value = value;
  }
}
