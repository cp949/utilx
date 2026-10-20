const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
} as const;

/**
 * HTML 텍스트와 따옴표로 감싼 일반 속성 값에서 의미가 있는 문자 `& < > " '`를 엔티티로 바꾼다.
 *
 * 속성 값은 반드시 작은따옴표나 큰따옴표로 감싼다. 공백과 `=`는 변환하지 않으므로 따옴표 없는 속성에는 쓸 수 없다.
 * `script`, `style` 안이나 이벤트 핸들러(`onclick` 등), `style`, URL 속성(`href` 등)에는 쓸 수 없다.
 * 그 위치에는 맞는 방식으로 따로 처리한다. 이미 엔티티인 `&amp;`도 `&amp;amp;`로 다시 바꾼다.
 *
 * @example
 * escapeHtml('<a href="x">Tom & Jerry</a>'); // '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;'
 */
export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => HTML_ESCAPES[char as keyof typeof HTML_ESCAPES],
  );
}
