// Extracting the ArrayElement type from an Array type
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// Making one or more properties in a type optional
export type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> &
  Partial<Pick<Type, Key>>;

// The type U must be a subtype of type T (entity).
// It must contain an id and can optionally contain other fields of type T.
// It cannot contain properties that are not in type T.
export type EntitySubset<T extends { id: string }, U> = {
  [K in keyof U]: K extends keyof T ? T[K] : never;
} & Pick<T, "id"> &
  Partial<Omit<T, "id">>;
