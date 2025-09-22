import React from 'react';

interface PolymorphicComponentProps<T extends React.ElementType = 'div'> {
  as?: T;
  children?: React.ReactNode;
  className?: string;
}

export function PolymorphicComponent<T extends React.ElementType = 'div'>(
  { as, children, className, ...props }: PolymorphicComponentProps<T> & React.ComponentPropsWithoutRef<T>
) {
  const Component = as || 'div';

  // Filter out internal props that shouldn't be passed to DOM elements
  const filteredProps = Object.keys(props).reduce((acc, key) => {
    // Filter out internal Vite/React Router props
    if (key.startsWith('data-vite-') ||
        key.startsWith('renderId') ||
        key.startsWith('__') ||
        key === 'renderId' ||
        key === 'data-react-helmet') {
      return acc;
    }
    return { ...acc, [key]: props[key] };
  }, {});

  return (
    <Component className={className} {...filteredProps}>
      {children}
    </Component>
  );
}

// Default export for compatibility
export default PolymorphicComponent;
