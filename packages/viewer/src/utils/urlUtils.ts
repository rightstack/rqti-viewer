/**
 * 미디어 src를 절대 URL로 변환한다.
 * 이미 절대 URL이면 그대로, 상대 경로면 baseUrl과 결합한다.
 *
 * @param src - 원본 src 경로 (상대 또는 절대)
 * @param baseUrl - 상대 경로 해석에 사용할 베이스 URL
 */
export function resolveMediaUrl(
  src: string | null | undefined,
  baseUrl?: string
): string | undefined {
  if (!src) return undefined;

  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")) {
    return src;
  }

  if (!baseUrl) return src;

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedSrc = src.startsWith("/") ? src : `/${src}`;

  return `${normalizedBaseUrl}${normalizedSrc}`;
}
