/* eslint-disable @typescript-eslint/no-explicit-any */
export const omit = <
  T extends Record<string, unknown> | object,
  K extends keyof any
>(
  inputObj: T,
  ...keys: K[]
): Omit<T, K> => {
  const keysSet = new Set(keys);
  return Object.fromEntries(
    Object.entries(inputObj).filter(([k]) => !keysSet.has(k as any))
  ) as any;
};
