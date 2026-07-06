/**
 * `fetch().json()` throws "Unexpected token '<'" when the body is HTML (404 pages, Cloudflare,
 * wrong base URL pointing at a website root, etc.). Use this after `res.ok` for clearer errors.
 */
export async function readJsonResponse<T>(res: Response, context: string): Promise<T> {
  let text = await res.text()
  text = text.replace(/^\uFEFF/, '')
  const start = text.trimStart().slice(0, 1)
  if (start === '<') {
    throw new Error(
      `${context}: received an HTML page instead of JSON (HTTP ${res.status}). Check the API URL, ` +
        `your network, or whether the service is blocking the request (wrong base URL is a common cause).`,
    )
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`${context}: response was not valid JSON (HTTP ${res.status}).`)
  }
}
