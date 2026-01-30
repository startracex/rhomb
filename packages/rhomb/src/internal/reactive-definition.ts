import type { PropertyInit } from "../decorators/property.ts";

import { fromAttribute, normalizeAttribute, toAttribute } from "../attribute.ts";

interface PropertyInitExtend {
  property: PropertyKey;
  attribute: string | null;
}

export type PropertyDefinition = Required<Omit<PropertyInit, keyof PropertyInitExtend>> &
  PropertyInitExtend;

const hasChanged = (newValue: any, oldValue: any) => !Object.is(newValue, oldValue);

const reducePrototypes = <V extends object, R>(
  callback: (current: V, _super: R) => R,
  cache: WeakMap<V, R>,
): ((current: V) => R) => {
  const fn = (current: V): R => {
    let result = cache.get(current);
    if (result !== undefined) {
      return result as NonNullable<R>;
    }
    const _super = Reflect.getPrototypeOf(current) as V | null;
    const value = callback(current, _super ? fn(_super) : undefined);
    cache.set(current, value);
    return value;
  };
  return fn;
};

/**
 * Each class constructor has a reactive definition.
 * All reactive property definitions will be normalized.
 */
export class ReactiveDefinition {
  protected properties: Map<PropertyKey, PropertyDefinition>;
  protected attributes: Map<string, PropertyDefinition>;

  static load: (cons: any) => ReactiveDefinition = reducePrototypes<any, ReactiveDefinition>(
    (cons, superFinalized) => new this(cons.properties, superFinalized),
    new WeakMap([[HTMLElement, null]]),
  );

  constructor(
    properties: Record<PropertyKey, PropertyInit<any, any, any>> = {},
    superDef?: ReactiveDefinition,
  ) {
    this.attributes = new Map(superDef?.attributes);
    this.properties = new Map(superDef?.properties);

    for (const property in properties) {
      this.store(property, properties[property]);
    }
  }

  get observedAttributes(): string[] {
    return [...this.attributes.keys()];
  }

  get reactiveProperties(): PropertyDefinition[] {
    return [...this.properties.values()];
  }

  store(property: PropertyKey, init: PropertyInit): PropertyDefinition {
    const attribute = normalizeAttribute(init.attribute, property);
    const config: PropertyDefinition = {
      type: String,
      reflect: false,
      fromAttribute,
      toAttribute,
      hasChanged,
      ...init,
      descriptor: init.descriptor ?? {},
      attribute,
      property,
    };
    this.properties.set(property, config);
    if (attribute) {
      this.attributes.set(attribute, config);
    }
    return config;
  }

  loadProperty(property: PropertyKey): PropertyDefinition {
    return this.properties.get(property);
  }

  loadAttribute(key: string): PropertyDefinition {
    return this.attributes.get(key);
  }
}
