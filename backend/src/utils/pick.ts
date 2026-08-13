// Returns a new object containing only the given keys from `obj`.
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
        acc[key] = obj[key];
      }
      return acc;
    },
    {} as Pick<T, K>,
  );
}
