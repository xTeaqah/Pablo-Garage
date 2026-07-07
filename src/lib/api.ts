export async function getApiError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // ignore parse errors
  }
  return fallback;
}
