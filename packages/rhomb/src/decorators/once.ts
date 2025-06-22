interface OnceDecorator {
  (_: any, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor;
  (_: any, context: ClassMethodDecoratorContext): void;
}

export const once: OnceDecorator = (
  _: any,
  propertyKeyOrContext: PropertyKey | ClassMethodDecoratorContext,
  descriptor?: PropertyDescriptor,
) => {
  const instanceMap = new WeakMap();
  if (typeof propertyKeyOrContext !== "object") {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      if (!instanceMap.has(this)) {
        const result = originalMethod.apply(this, args);
        instanceMap.set(this, result);
        return result;
      }
      return instanceMap.get(this);
    };

    return descriptor;
  }

  const context = propertyKeyOrContext;
  const methodName = context.name;

  context.addInitializer(function (this: any) {
    const originalMethod = this[methodName];

    this[methodName] = function <T extends any[], R>(...args: T): R {
      if (instanceMap.has(this)) {
        return instanceMap.get(this);
      }
      const result = originalMethod.apply(this, args);
      instanceMap.set(this, result);
      return result;
    };
  });
};
