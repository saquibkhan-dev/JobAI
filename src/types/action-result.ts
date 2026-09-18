/**
 * Every Server Action returns this shape instead of throwing across the
 * server/client boundary. Keeps error handling uniform and type-safe in
 * every calling component.
 */
export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };
