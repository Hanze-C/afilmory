const ALLOW_PLACEHOLDER_TENANT_METADATA = Symbol.for('core.tenant.allow-placeholder')

type DecoratorTarget = object | Function

function setAllowPlaceholderMetadata(target: DecoratorTarget): void {
  Reflect.defineMetadata(ALLOW_PLACEHOLDER_TENANT_METADATA, true, target)
}

export function AllowPlaceholderTenant(): ClassDecorator & MethodDecorator {
  return ((target: DecoratorTarget, _propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor?.value && typeof descriptor.value === 'function') {
      setAllowPlaceholderMetadata(descriptor.value)
      return descriptor
    }

    setAllowPlaceholderMetadata(target)
    return descriptor
  }) as unknown as ClassDecorator & MethodDecorator
}

export function isPlaceholderTenantAllowed(target: DecoratorTarget | undefined): boolean {
  if (!target) {
    return false
  }

  try {
    return (Reflect.getMetadata(ALLOW_PLACEHOLDER_TENANT_METADATA, target) ?? false) === true
  } catch {
    return false
  }
}
