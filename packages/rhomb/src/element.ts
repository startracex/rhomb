import { type Delegate, DefaultDelegate } from "./delegate.js";
import { Snapshot } from "./snapshot.js";
import { Scheduler } from "./scheduler.js";
import { normalizeAttribute } from "./attribute.js";
import type { ReactivePropertyInit } from "./decorators/property.js";

const CONSTRUCTED = "constructed";
const CONNECTED = "connected";

type Opportunity = typeof CONSTRUCTED | typeof CONNECTED;

function isAttachmentConstructed(v: any): boolean {
  return v.attachment === CONSTRUCTED;
}

function isAttachmentConnected(v: any): boolean {
  return v.attachment === CONNECTED;
}

export type ReactiveProperties<T extends RhombElement = RhombElement> = Record<PropertyKey, ReactivePropertyInit<T>>;
export type ChangedProperties<T extends RhombElement = RhombElement, K extends keyof T = keyof T> = Map<K, T[K]>;

export class RhombElement extends HTMLElement {
  static properties: ReactiveProperties = {};
  static attributes: Record<string, PropertyKey> = {};
  static attachment: Opportunity = CONNECTED;

  protected snapshot: Snapshot = new Snapshot();
  protected scheduler: Scheduler = new Scheduler({
    performable: () => this.isConnected,
    snapshot: this.snapshot,
    callbacks: {
      update: this.update.bind(this),
      shouldUpdate: this.shouldUpdate.bind(this),
    },
  });
  protected delegate: Delegate = new DefaultDelegate({
    target: this,
    scheduler: this.scheduler,
  });

  static get observedAttributes(): string[] {
    const _super = Object.getPrototypeOf(this) as typeof RhombElement;
    const superProperties = _super.properties;
    const properties = (this.properties = {
      ...superProperties,
      ...this.properties,
    });

    for (const key in properties) {
      const attribute = normalizeAttribute(properties[key]?.attribute, key);
      if (attribute) {
        this.attributes[attribute] = key;
      }
    }
    return Object.keys(this.attributes);
  }

  protected shadowRootInit: ShadowRootInit = {
    mode: "open",
  };

  attachShadow(init: ShadowRootInit): ShadowRoot {
    let { shadowRoot } = this;
    if (shadowRoot) {
      return shadowRoot;
    }
    shadowRoot = super.attachShadow(init);
    const properties = (this.constructor as typeof RhombElement).properties;
    for (const propertyName in properties) {
      this.delegate.add(propertyName, properties[propertyName]);
    }
    return shadowRoot;
  }

  constructor() {
    super();
    if (isAttachmentConstructed(this.constructor)) {
      this.attachShadow(this.shadowRootInit);
      this.requestUpdate();
      this.snapshot.commit();
    }
  }

  connectedCallback(): void {
    if (isAttachmentConnected(this.constructor)) {
      this.attachShadow(this.shadowRootInit);
      this.requestUpdate();
      this.snapshot.commit();
    }
  }

  disconnectedCallback(): void {}

  adoptedCallback(): void {}

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    this.delegate.setAttribute(name, newValue);
  }

  requestUpdate(): Promise<void> {
    return this.scheduler.requestUpdate();
  }
  protected shouldUpdate(changes: Map<PropertyKey, any>): boolean {
    return true;
  }

  update(changes?: Map<PropertyKey, any>): void {}

  get updateComplete(): Promise<void> {
    return this.scheduler.updateComplete;
  }

  get changedProperties(): Map<PropertyKey, any> {
    return this.snapshot.changes;
  }
}
