// Extracting the ArrayElement type from an Array type
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// The type U must be a subtype of type T (entity).
// It must contain an id and can optionally contain other fields of type T.
// It cannot contain properties that are not in type T.
export type EntitySubset<T extends { id: string }, U> = {
  [K in keyof U]: K extends keyof T ? T[K] : never;
} & Pick<T, "id"> &
  Partial<Omit<T, "id">>;

// At least one of type t should be present in the object
export type AtLeastOne<T, Keys extends keyof T = keyof T> = Partial<T> &
  { [K in Keys]: Required<Pick<T, K>> }[Keys];
