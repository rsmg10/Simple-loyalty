// Route handlers call `request.json()` on bodies from real client devices —
// a dropped mobile connection or a buggy client can send no body or
// malformed JSON, which should surface as a 400 (bad input), not an
// uncaught 500 (server bug).
export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
