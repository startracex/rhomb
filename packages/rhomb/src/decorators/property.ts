import type { RhombElement } from "../element.ts";

import { ReactiveDefinition, type PropertyDefinition } from "../internal/reactive-definition.ts";

const loadOrStoreWithMetadata = (
  rd: ReactiveDefinition,
  property: PropertyKey,
  init: PropertyInit & {
    metadata?: DecoratorMetadataObject | undefined;
  },
): PropertyDefinition => {
  const loaded = rd.loadProperty(property) as PropertyDefinition & {
    metadata?: DecoratorMetadataObject | undefined;
  };
  if (loaded && init.metadata && loaded.metadata === init.metadata) {
    return loaded;
  }
  return rd.store(property, init);
};

type ConstructorType<V> = V extends string
  ? StringConstructor
  : V extends number
    ? NumberConstructor
    : V extends boolean
      ? BooleanConstructor
      : V extends object
        ? new (...args: any[]) => V
        : any;

export interface PropertyInit<T = any, V = any, Y = ConstructorType<V>> {
  reflect?: boolean;
  attribute?: string | boolean;
  fromAttribute?: (this: T, attributeValue: string, type?: Y) => V;
  toAttribute?: (this: T, propertyValue: V, type?: Y) => string | null;
  type?: Y;
  hasChanged?: (value1: V, value2: V) => boolean;
  descriptor?: Pick<PropertyDescriptor, "set">;
}

export interface PropertyDecorator<T, V> {
  /** legacy decorator */
  (proto: T, propertyKey: PropertyKey, descriptor?: PropertyDescriptor): void;

  /** standard decorator */
  // accessor
  (
    target: ClassAccessorDecoratorTarget<T, V>,
    context: ClassAccessorDecoratorContext<T, V>,
  ): ClassAccessorDecoratorResult<T, any>;
  // field
  (_: undefined, context: ClassFieldDecoratorContext<T, V>): void;
  // setter
  (setter: (value: V) => void, key: ClassSetterDecoratorContext<T, V>): (this: T, value: V) => void;
}

export const property = <V, T extends RhombElement>(
  propertyInit: PropertyInit<T, V> = {},
): PropertyDecorator<T, V> => {
  return (
    target: T | ClassAccessorDecoratorTarget<T, V> | undefined | ((value: V) => void),
    nameOrContext:
      | PropertyKey
      | ClassAccessorDecoratorContext<T, V>
      | ClassFieldDecoratorContext<T, V>
      | ClassSetterDecoratorContext<T, V>,
    _?: PropertyDescriptor,
  ): any => {
    if (typeof nameOrContext === "object") {
      const { kind, name, metadata } = nameOrContext;

      if (kind === "setter") {
        const descriptor = {
          set(this: T, value: any) {
            (target as (this: T, value: V) => void).call(this, value);
          },
        };

        nameOrContext.addInitializer(function (this: T) {
          loadOrStoreWithMetadata(ReactiveDefinition.load(this.constructor), name, {
            ...propertyInit,
            descriptor,
            metadata,
          });
        });
        return function (this: RhombElement, value) {
          this.delegate.setDelegateValue(name, value);
        };
      }

      if (kind === "accessor") {
        const descriptor = {
          set(this: T, value: any) {
            (target as ClassAccessorDecoratorTarget<T, V>).set.call(this, value);
          },
        };

        nameOrContext.addInitializer(function (this: T) {
          loadOrStoreWithMetadata(ReactiveDefinition.load(this.constructor), name, {
            ...propertyInit,
            descriptor,
            metadata,
          });
        });

        return {
          set(this: T, value: any) {
            this.delegate.setDelegateValue(name, value);
          },
        };
      }

      return nameOrContext.addInitializer(function (this: T) {
        const config = loadOrStoreWithMetadata(ReactiveDefinition.load(this.constructor), name, {
          ...propertyInit,
          metadata,
        });
        /* manual set value to this[name] */
        this.delegate.setDelegateValue(name, this[name]);
        /* redefine property after value is set */
        this.delegate.defineProperty(config);
      });
    }

    const descriptor = Object.getOwnPropertyDescriptor(target, nameOrContext);
    ReactiveDefinition.load(target.constructor).store(nameOrContext, {
      ...propertyInit,
      descriptor,
    });

    if (Object.hasOwn(target as object, nameOrContext)) {
      return descriptor;
    }
  };
};
