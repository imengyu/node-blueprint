export function DevAssert(condition: any, message?: string) {
  if (!condition)
    throw new Error(message ?? "assert failed");
}