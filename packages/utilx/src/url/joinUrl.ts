/** 프로토콜만 있는 조각. 예: `http:`, `https://`. */
const PROTOCOL_ONLY = /^[^/:]+:\/*$/;
const FILE_TRIPLE_SLASH = /^file:\/\/\//;
const IPV6_HOST = /^\[.*:.*\]/;
const PROTOCOL_PREFIX = /^([^/:]+):\/*/;

/**
 * URL 조각을 `/` 하나로 이어 붙인다. `path.join`과 비슷하지만 프로토콜, 쿼리, 해시를 인식한다.
 *
 * - 빈 문자열 조각은 건너뛴다. 조각이 없거나 모두 비어 있으면 `''`다.
 * - 조각 사이의 중복 `/`는 하나로 합친다. 첫 조각의 선행 `/`와 마지막 조각의 끝 `/`는 하나로 유지한다.
 * - 첫 조각이 `http:` 같은 프로토콜뿐이면 다음 조각과 합친다. 프로토콜 뒤 `/`는 2개로 맞추고 `file:///`은 3개를 유지한다.
 *   프로토콜 상대 URL(`//cdn.example.com`)과 IPv6 호스트(`[::1]`)는 그대로 둔다.
 * - 첫 조각이 `/`이면 다음 조각과 합쳐 루트를 보존한다.
 * - `?`, `&`, `#`로 시작하는 조각은 `/` 없이 붙인다. 쿼리 조각은 `?`로 시작해 `&`로 이어진다.
 *   `&`는 위치와 상관없이 쿼리 구분자로 보므로 경로에 `&`가 들어 있으면 쓰지 않는다.
 * - `#` 뒤(해시)는 해석하지 않는다. 해시가 비어 있으면(`#`뿐이면) 버린다.
 * - 인코딩은 하지 않고 이미 인코딩된 `%2F` 등은 건드리지 않는다. 조각에 `?`나 `#`을 넣지 않으면 경로 조각 결합에 쓴다.
 *
 * @throws {TypeError} 문자열이 아닌 조각이 있을 때(`null`, `undefined` 포함)
 *
 * @example
 * joinUrl('https://example.com/', '/api/', '/v1'); // 'https://example.com/api/v1'
 * joinUrl('/', 'a'); // '/a'
 * joinUrl('http:', 'www.example.com', 'foo', '?a=1', '&b=2', '#top');
 * // 'http://www.example.com/foo?a=1&b=2#top'
 */
export function joinUrl(...parts: string[]): string {
  for (const part of parts) {
    if (typeof part !== "string") {
      throw new TypeError(`URL 조각은 문자열이어야 한다: ${String(part)}`);
    }
  }

  const items = parts.filter((part) => part !== "");
  if (items.length === 0) return "";

  mergeLeadingParts(items);

  const first = items[0] as string;
  if (FILE_TRIPLE_SLASH.test(first)) {
    items[0] = first.replace(PROTOCOL_PREFIX, "$1:///");
  } else if (!IPV6_HOST.test(first)) {
    items[0] = first.replace(PROTOCOL_PREFIX, "$1://");
  }

  const pieces = trimSlashes(items);

  let joined = "";
  pieces.forEach((piece, index) => {
    if (index === 0) {
      joined = piece;
      return;
    }
    const previous = pieces[index - 1] as string;
    // 직전 조각이 `?`나 `#`로 끝나면 구분자를 넣지 않는다.
    joined +=
      previous.endsWith("?") || previous.endsWith("#") ? piece : `/${piece}`;
  });

  return normalizeQueryAndHash(joined);
}

/** 첫 조각이 프로토콜뿐이거나 `/`뿐이면 다음 조각과 합쳐 슬래시 제거 때 사라지지 않게 한다. */
function mergeLeadingParts(items: string[]): void {
  const first = items[0] as string;
  if (PROTOCOL_ONLY.test(first) && items.length > 1) {
    items.splice(0, 2, first + (items[1] as string));
  }
  if (items[0] === "/" && items.length > 1) {
    items.splice(0, 2, "/" + (items[1] as string));
  }
}

/** 첫 조각을 뺀 조각의 선행 `/`, 마지막 조각을 뺀 조각의 끝 `/`를 없애고, 마지막 조각의 끝 `/`는 하나로 줄인다. */
function trimSlashes(items: string[]): string[] {
  const last = items.length - 1;
  const result: string[] = [];
  items.forEach((item, index) => {
    let piece = item;
    if (index > 0) piece = piece.replace(/^\/+/, "");
    piece =
      index < last ? piece.replace(/\/+$/, "") : piece.replace(/\/+$/, "/");
    if (piece !== "") result.push(piece);
  });
  return result;
}

/** 쿼리 앞의 `/`를 없애고 `?`/`&` 조각을 `?a=1&b=2` 하나로 합치고, 비어 있는 해시를 버린다. */
function normalizeQueryAndHash(url: string): string {
  const withoutSlash = url.replace(/\/(\?|&|#(?!!))/g, "$1");

  const hashIndex = withoutSlash.indexOf("#");
  const beforeHash =
    hashIndex < 0 ? withoutSlash : withoutSlash.slice(0, hashIndex);
  const hash = hashIndex < 0 ? "" : withoutSlash.slice(hashIndex);

  const [path = "", ...queries] = beforeHash.split(/[?&]+/);
  const query = queries.filter((item) => item !== "").join("&");
  return (
    path + (query === "" ? "" : `?${query}`) + (hash.length > 1 ? hash : "")
  );
}
