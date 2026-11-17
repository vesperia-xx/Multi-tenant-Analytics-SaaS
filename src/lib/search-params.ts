/** Next gives repeated query keys as arrays; forms want the first value. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
