import React from "react";

export interface IValidateChildrenOptions<T> {
  allowedTypes: T[];
  expectedChildrenCount?: number;
}
const isValidChildren =
  <T>({ allowedTypes, expectedChildrenCount }: IValidateChildrenOptions<T>) =>
  (children: React.ReactNode): { isValid: boolean; validChildren: T[] } => {
    const childrenArray = Array.isArray(children) ? children : [children];
    const validChildren = childrenArray.filter((child) =>
      allowedTypes.includes(child.type as T),
    ) as T[];
    const isValid = expectedChildrenCount
      ? validChildren.length === expectedChildrenCount
      : validChildren.length === childrenArray.length;
    return { isValid, validChildren };
  };

export default isValidChildren;

/**
 * Example usage of the isValidChildren function
    const { isValid, validChildren } = validateChildren({
        allowedTypes: [Card.Header, Card.Body],
        checkCount: true,
    })(props.children);

    if (!isValid) {
        console.error("Card component must have a Card.Header and a Card.Body..");
        return null;
    }
 */
