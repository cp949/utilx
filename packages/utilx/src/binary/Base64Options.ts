/** base64 변환 옵션. */
export interface Base64Options {
  /** `true`면 URL-safe base64(`-`, `_`)로 만들고 패딩(`=`)을 붙이지 않는다. 기본값은 `false`다. */
  urlSafe?: boolean;
}
