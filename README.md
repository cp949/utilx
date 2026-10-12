# @cp949/utilx

브라우저용 문자열, 바이트 표기, 파일명, 버퍼, cleanup scope, blob 유틸. 런타임 의존성 0, Chrome 75 하한(ES2019), ESM 전용이다.

2.0.0은 1.x의 일부 API를 재설계해 이름과 동작이 바뀌었다. 1.x에서 올리는 경우 아래 [1.x에서 옮기기](#1x에서-옮기기)를 따른다.

## 설치

```sh
pnpm add @cp949/utilx
```

## 공개 API

| subpath                   | export                                                                          | DOM    |
| ------------------------- | ------------------------------------------------------------------------------- | ------ |
| `@cp949/utilx`            | 아래 `string`, `bytes`, `file`, `buffer`, `disposable`, `async`의 모든 export   | 없음   |
| `@cp949/utilx/string`     | `trim`, `trimToUndef`, `isBlank`, `isNotBlank`                                  | 없음   |
| `@cp949/utilx/bytes`      | `formatByteCount`, 타입 `FormatByteCountOptions`                                | 없음   |
| `@cp949/utilx/file`       | `fileExtension`, `fileBaseName`, 타입 `FileExtensionOptions`                    | 없음   |
| `@cp949/utilx/buffer`     | `BoundedBuffer`                                                                 | 없음   |
| `@cp949/utilx/disposable` | `DisposableScope`, `DisposeError`, `listen`, 타입 `CleanupFn`, `DisposableLike` | 타입만 |
| `@cp949/utilx/async`      | `delay`                                                                         | 없음   |
| `@cp949/utilx/web`        | `downloadBlob`, `URLCreateRegistry`                                             | 필요   |

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

### buffer

```ts
import { BoundedBuffer } from "@cp949/utilx/buffer";

const messages = new BoundedBuffer<string>(100);
messages.push("안녕");
const visible = messages.toArray(); // 오래된 순서의 새 배열
```

- 최대 개수를 넘으면 가장 오래된 항목을 버린다. 채팅 메시지나 로그를 최근 n개만 유지하는 용도다.
- 비어 있으면 `shift`, `peekOldest`, `peekNewest`는 `undefined`를 돌려준다. `maxSize`가 1 이상의 정수가 아니면 `RangeError`다.
- `push`, `shift`, `peek*`는 O(1)이다. `toArray`, `clone`, 순회는 O(n)이다.

### disposable

React 컴포넌트 언마운트처럼 "여러 자원을 한 번에 정리"하는 지점에 쓴다.

```ts
import { DisposableScope, listen } from "@cp949/utilx/disposable";

const scope = new DisposableScope();
scope.use(listen(window, "resize", onResize)); // 리스너 해제 등록
scope.setTimeout(() => console.log("1초 뒤"), 1000); // 타이머 취소 등록
scope.use(() => socket.close()); // 임의의 cleanup
fetch(url, { signal: scope.signal }); // dispose 때 abort

scope.dispose(); // 등록의 역순으로 정리
```

- `use`는 함수이거나 `dispose()`를 가진 객체를 받는다. `close()` 등 다른 이름은 함수로 감싼다.
- `defer(cleanup)`은 cleanup을 등록하고, 지금 실행하는 함수를 돌려준다.
- cleanup이 던져도 나머지는 끝까지 실행한다. 마지막에 `DisposeError`(`errors` 배열)로 모아서 던진다.
- `dispose()`는 여러 번 호출해도 한 번만 실행한다. `dispose()`된 scope에 등록하면 대상을 즉시 정리한 뒤 예외를 던진다.
- `scope.signal`은 `dispose()` 때 abort된다.

### async

```ts
import { delay } from "@cp949/utilx/async";

await delay(500);
await delay(5000, controller.signal); // abort되면 AbortError로 거부
```

### web

```ts
import { downloadBlob, URLCreateRegistry } from "@cp949/utilx/web";

downloadBlob(new Blob(["hello"], { type: "text/plain" }), "hello.txt");

const registry = new URLCreateRegistry();
const url = registry.acquire(file); // 같은 Blob이면 같은 URL, 참조 횟수 +1
registry.release(file); // 0이 되면 revoke
registry.revokeAll(); // 모두 해제, 계속 사용 가능
registry.close(); // 모두 해제하고 닫음, 되돌릴 수 없음
```

- `downloadBlob`은 `<a download>` 방식이다. `download` 속성이 없는 환경에서는 동작하지 않는다. 사용자 제스처 안에서 호출해야 하며, object URL은 40초 뒤에 해제한다.
- `URLCreateRegistry`는 GC 때 자동으로 해제하지 않는다. 등록된 Blob은 해제하기 전까지 메모리에 남는다.
- **React StrictMode**: effect cleanup에서 `close()`를 부른 인스턴스를 재실행에서 다시 쓰면 `acquire()`가 예외를 던진다. 인스턴스를 effect 안에서 만들거나 cleanup에서 `revokeAll()`만 부른다.

## 1.x에서 옮기기

| 1.x                                         | 2.0.0                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `genId`, `genUid`                           | 제거. `@cp949/random/id`의 `randomId`, `nanoid`를 쓴다                                     |
| `BoundedBuffer`                             | 유지. 빈 버퍼의 `shift`/`peek*`가 `null` 대신 `undefined`, 잘못된 `maxSize`가 `RangeError` |
| `URLCreateRegistry`                         | `@cp949/utilx/web`로 이동. 동작 동일                                                       |
| `DisposableScope`                           | 재설계. `use`/`defer`/`setTimeout`/`signal`/`dispose`. `adopt`, `delete`, `listen` 제거    |
| `DisposableAbortController`                 | 제거. `scope.signal`을 쓴다. 1.x는 scope에 넣어도 `dispose()` 때 abort되지 않았다          |
| `DisposableTimeout`, `setDisposableTimeout` | 제거. `scope.setTimeout`을 쓴다                                                            |
| `listen`                                    | `@cp949/utilx/disposable`에 유지. `scope.use(listen(...))`로 등록한다                      |
| `delay(ms, signal, canceledAsError)`        | `delay(ms, signal)`. abort되면 항상 `AbortError`로 거부한다                                |
| `CleanupFn`, `DisposableLike`               | 유지. `DisposableLike`는 함수이거나 `dispose()`를 가진 객체만 받는다                       |
| cleanup이 던진 예외                         | 1.x는 삼켰다. 2.0.0은 `DisposeError`로 던진다                                              |

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
