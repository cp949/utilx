# @cp949/utilx

브라우저용 문자열, 바이트 표기, 파일명, blob 다운로드 유틸. 런타임 의존성 0, Chrome 75 하한(ES2019), ESM 전용이다.

2.0.0은 1.x(`DisposableScope`, `genId` 등)와 API가 겹치지 않는다. 1.x에서 올리는 경우 아래 [1.x에서 옮기기](#1x에서-옮기기)를 따른다.

## 설치

```sh
pnpm add @cp949/utilx
```

## 공개 API

| subpath               | export                                                       | DOM  |
| --------------------- | ------------------------------------------------------------ | ---- |
| `@cp949/utilx`        | 아래 `string`, `bytes`, `file`의 모든 export                 | 없음 |
| `@cp949/utilx/string` | `trim`, `trimToUndef`, `isBlank`, `isNotBlank`               | 없음 |
| `@cp949/utilx/bytes`  | `formatByteCount`, 타입 `FormatByteCountOptions`             | 없음 |
| `@cp949/utilx/file`   | `fileExtension`, `fileBaseName`, 타입 `FileExtensionOptions` | 없음 |
| `@cp949/utilx/web`    | `downloadBlob`                                               | 필요 |

import 경로 조건은 TypeScript의 `moduleResolution`이 `Bundler` 또는 `NodeNext`인 경우다.

### string

```ts
import { isBlank, trim, trimToUndef } from "@cp949/utilx/string";

trim(undefined); // ''
trimToUndef("   "); // undefined
isBlank("　"); // true (전각 공백)
```

- 공백 기준은 `String.prototype.trim()`과 같다.
- `isBlank`, `isNotBlank`는 타입 가드가 아니다. `false`일 때 `string`이 아닌 쪽으로 좁혀지는 오류를 피하기 위해서다. 좁힌 값이 필요하면 `trimToUndef`를 쓴다.

### bytes

```ts
import { formatByteCount } from "@cp949/utilx/bytes";

formatByteCount(1536); // '1.5 KB'
formatByteCount(1536, { base: 1000 }); // '1.5 KB'
formatByteCount(2048, { units: ["바이트", "KB"] }); // '2 KB'
```

- 첫 단위는 정수, 그 위 단위는 10 미만이면 소수 첫째 자리까지 표기한다. `.0`은 생략한다.
- 반올림 결과가 `base`에 닿으면 다음 단위로 올린다.
- `NaN`, `Infinity`는 `RangeError`다.

### file

```ts
import { fileBaseName, fileExtension } from "@cp949/utilx/file";

fileExtension("Photo.JPG", { lowerCase: true }); // 'jpg'
fileExtension(".bashrc"); // null
fileBaseName("a.tar.gz"); // 'a.tar'
```

- 확장자는 마지막 `.` 뒤의 문자열이다. `.`이 없거나 이름 앞·뒤에만 있으면 확장자가 없다(`null`).
- 경로는 다루지 않는다.

### web

```ts
import { downloadBlob } from "@cp949/utilx/web";

downloadBlob(new Blob(["hello"], { type: "text/plain" }), "hello.txt");
```

- `<a download>` 방식이다. `download` 속성이 없는 환경에서는 동작하지 않는다.
- 사용자 제스처 안에서 호출해야 브라우저가 막지 않는다.
- object URL은 클릭 직후가 아니라 40초 뒤에 해제한다.

## 1.x에서 옮기기

2.0.0에서 1.x의 export를 모두 제거했다.

| 1.x                                     | 대체                                      |
| --------------------------------------- | ----------------------------------------- |
| `genId`, `genUid`                       | `@cp949/random/id`의 `randomId`, `nanoid` |
| `DisposableScope`, `listen`, `delay` 등 | 대체 없음. 1.x를 계속 사용한다            |
| `URLCreateRegistry`, `BoundedBuffer`    | 대체 없음. 1.x를 계속 사용한다            |

## 개발

```sh
pnpm install
pnpm verify
```

`pnpm verify`는 다음을 순서대로 실행한다.

| 명령                  | 검사                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `pnpm lint`           | ESLint. `src/**`의 Node 전역, `Math.random`, 외부 import 금지. DOM 전역은 `src/web`에서만 허용         |
| `pnpm format:check`   | prettier                                                                                               |
| `pnpm build`          | `dist`를 지우고 `tsc`로 빌드                                                                           |
| `pnpm check:escompat` | `dist`가 `baseline.json`의 Chrome 하한(75)과 ES2019 기준을 만족하는지. `dist/web` 밖의 DOM 전역도 검사 |
| `pnpm check:deps`     | 소스와 tarball의 런타임 의존성이 0인지                                                                 |
| `pnpm check-types`    | 소스와 테스트의 타입 검사                                                                              |
| `pnpm test`           | 단위 테스트                                                                                            |

Chrome 하한은 `baseline.json` 한 곳에서만 선언한다. 실제 브라우저 실행 검증은 하지 않는다. `check:escompat`은 정적 검사다.

## 라이선스

MIT
