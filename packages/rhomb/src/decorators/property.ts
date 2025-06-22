import type { RhombElement } from "../element.js";

type ConstructorType<V> = V extends string
  ? StringConstructor
  : V extends number
    ? NumberConstructor
    : V extends boolean
      ? BooleanConstructor
      : V extends object
        ? new (...args: any[]) => V
        : any;

export interface ReactivePropertyInit<T extends RhombElement = RhombElement, V = any, Y = ConstructorType<V>> {
  reflect?: boolean | ((this: T, value?: V) => boolean);
  attribute?: string | boolean;
  fromAttribute?: (this: T, attributeValue: string, type?: Y) => V;
  toAttribute?: (this: T, propertyValue: V, type?: Y) => string | null;
  type?: Y;
  hasChanged?: (value1: V, value2: V) => boolean;
  descriptor?: PropertyDescriptor | undefined;
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
  (_: any, context: ClassFieldDecoratorContext<T, V>): void;
  // setter
  (setter: (value: V) => void, key: ClassSetterDecoratorContext<T, V>): (this: T, value: V) => void;
}

export const property = <V, T extends RhombElement>(
  propertyType: ReactivePropertyInit<T, V> = {},
): PropertyDecorator<T, V> => {
  return (
    arg0: T | ClassAccessorDecoratorTarget<T, V> | ((value: V) => void),
    arg1:
      | PropertyKey
      | ClassAccessorDecoratorContext<T, V>
      | ClassFieldDecoratorContext<T, V>
      | ClassSetterDecoratorContext<T, V>,
    _?: PropertyDescriptor,
  ): any => {
    if (typeof arg1 !== "object") {
      const descriptor = Object.getOwnPropertyDescriptor(arg0, arg1);
      if (descriptor === undefined) {
        (arg0.constructor as typeof RhombElement).properties[arg1] = propertyType;
      } else {
        (arg0.constructor as typeof RhombElement).properties[arg1] = {
          ...propertyType,
          descriptor,
        };
      }
      return;
    }
    const { kind, name } = arg1;
    arg1.addInitializer(function () {
      (this.constructor as typeof RhombElement).properties[name] ??= {
        ...propertyType,
        descriptor: {
          set: kind === "setter" ? (arg0 as (value: any) => void) : undefined,
        },
      };
    });
  };
};
