# @cp949/utilx

브라우저용 문자열, nil 판별, 바이트 표기, 파일명, 버퍼, cleanup scope, blob 유틸. 런타임 의존성 0, Chrome 75 하한(ES2019), ESM 전용이다.

2.0.0은 1.x의 API를 재설계해 이름과 동작이 바뀌었다. 1.x에서 올리는 경우 아래 [1.x에서 옮기기](#1x에서-옮기기)를 따른다.

## 설치

```sh
pnpm add @cp949/utilx
```

진입점은 `@cp949/utilx` 하나다. 사용하지 않는 export는 번들러가 제거한다(`sideEffects: false`).

## 공개 API

| 영역        | export                                                                                               | DOM          |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| 문자열      | `trim`, `trimToUndefined`, `isBlank`, `isNotBlank`                                                   | 없음         |
| nil 판별    | `isNil`, `isNotNil`                                                                                  | 없음         |
| 바이트 표기 | `formatByteCount`, 타입 `FormatByteCountOptions`                                                     | 없음         |
| 파일명      | `fileExtension`, `fileBaseName`, 타입 `FileExtensionOptions`                                         | 없음         |
| 버퍼        | `BoundedBuffer`                                                                                      | 없음         |
| cleanup     | `DisposableScope`, `DisposeError`, `addEventListenerWithCleanup`, 타입 `CleanupFn`, `DisposableLike` | 타입만       |
| 비동기      | `sleep`                                                                                              | 없음         |
| blob        | `downloadBlob`, `ObjectUrlRegistry`                                                                  | 호출 시 필요 |

이름은 `trim`처럼 널리 알려진 것은 그대로 쓰고, 그 밖에는 동작이 보이게 서술적으로 짓는다. 분류가 애매한 함수를 모아 두는 `misc` 같은 영역은 만들지 않는다.

DOM이 필요한 `downloadBlob`, `ObjectUrlRegistry`는 호출할 때만 `document`, `URL.createObjectURL`에 접근한다. import만으로는 접근하지 않으므로 서버에서 import해도 안전하다.

### 문자열

```ts
import { isBlank, trim, trimToUndefined } from "@cp949/utilx";

trim(undefined); // ''
trimToUndefined("   "); // undefined
isBlank("　"); // true (전각 공백)
```

- 공백 기준은 `String.prototype.trim()`과 같다.
- `isBlank`, `isNotBlank`는 타입 가드가 아니다. `false`일 때 `string`이 아닌 쪽으로 좁혀지는 오류를 피하기 위해서다. 좁힌 값이 필요하면 `trimToUndefined`를 쓴다.

### nil 판별

```ts
import { isNil, isNotNil } from "@cp949/utilx";

isNil(0); // false
isNil(undefined); // true
const names: string[] = ["a", null, "b"].filter(isNotNil);
```

- nil은 `null`과 `undefined`다. `0`, `''`, `false`, `NaN`은 nil이 아니다.
- 둘 다 타입 가드다. `isNotNil`은 `NonNullable<T>`로 좁힌다.

### 바이트 표기

```ts
import { formatByteCount } from "@cp949/utilx";

formatByteCount(1536); // '1.5 KB'
formatByteCount(1536, { base: 1000 }); // '1.5 KB'
formatByteCount(2048, { units: ["바이트", "KB"] }); // '2 KB'
```

- 첫 단위는 정수, 그 위 단위는 10 미만이면 소수 첫째 자리까지 표기한다. `.0`은 생략한다.
- 반올림 결과가 `base`에 닿으면 다음 단위로 올린다.
- `NaN`, `Infinity`는 `RangeError`다.

### 파일명

```ts
import { fileBaseName, fileExtension } from "@cp949/utilx";

fileExtension("Photo.JPG", { lowerCase: true }); // 'jpg'
fileExtension(".bashrc"); // null
fileBaseName("a.tar.gz"); // 'a.tar'
```

- 확장자는 마지막 `.` 뒤의 문자열이다. `.`이 없거나 이름 앞·뒤에만 있으면 확장자가 없다(`null`).
- 경로는 다루지 않는다.

### 버퍼

```ts
import { BoundedBuffer } from "@cp949/utilx";

const messages = new BoundedBuffer<string>(100);
messages.push("안녕");
const visible = messages.toArray(); // 오래된 순서의 새 배열
```

- 최대 개수를 넘으면 가장 오래된 항목을 버린다. 채팅 메시지나 로그를 최근 n개만 유지하는 용도다.
- 비어 있으면 `shift`, `peekOldest`, `peekNewest`는 `undefined`를 돌려준다. `maxSize`가 1 이상의 정수가 아니면 `RangeError`다.
- `push`, `shift`, `peek*`는 O(1)이다. `toArray`, `clone`, 순회는 O(n)이다.

### cleanup

React 컴포넌트 언마운트처럼 "여러 자원을 한 번에 정리"하는 지점에 쓴다.

```ts
import { DisposableScope, addEventListenerWithCleanup } from "@cp949/utilx";

const scope = new DisposableScope();
scope.use(addEventListenerWithCleanup(window, "resize", onResize)); // 리스너 해제 등록
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
- `addEventListenerWithCleanup`은 `window`, `document`, `HTMLElement`에서 이벤트 이름에 맞는 이벤트 타입이 추론된다.

### 비동기

```ts
import { sleep } from "@cp949/utilx";

await sleep(500);
await sleep(5000, controller.signal); // abort되면 AbortError로 거부
```

### blob

```ts
import { downloadBlob, ObjectUrlRegistry } from "@cp949/utilx";

downloadBlob(new Blob(["hello"], { type: "text/plain" }), "hello.txt");

const registry = new ObjectUrlRegistry();
const url = registry.acquire(file); // 같은 Blob이면 같은 URL, 참조 횟수 +1
registry.release(file); // 0이 되면 revoke
registry.revokeAll(); // 모두 해제, 계속 사용 가능
registry.close(); // 모두 해제하고 닫음, 되돌릴 수 없음
```

- `downloadBlob`은 `<a download>` 방식이다. `download` 속성이 없는 환경에서는 동작하지 않는다. 사용자 제스처 안에서 호출해야 하며, object URL은 40초 뒤에 해제한다.
- `ObjectUrlRegistry`는 GC 때 자동으로 해제하지 않는다. 등록된 Blob은 해제하기 전까지 메모리에 남는다.
- **React StrictMode**: effect cleanup에서 `close()`를 부른 인스턴스를 재실행에서 다시 쓰면 `acquire()`가 예외를 던진다. 인스턴스를 effect 안에서 만들거나 cleanup에서 `revokeAll()`만 부른다.

## 1.x에서 옮기기

2.0.0은 서브패스 없이 `@cp949/utilx` 하나로 import한다.

| 1.x                                         | 2.0.0                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `genId`, `genUid`                           | 제거. `@cp949/random/id`의 `randomId`, `nanoid`를 쓴다                                     |
| `BoundedBuffer`                             | 유지. 빈 버퍼의 `shift`/`peek*`가 `null` 대신 `undefined`, 잘못된 `maxSize`가 `RangeError` |
| `URLCreateRegistry`                         | `ObjectUrlRegistry`로 이름 변경. 동작 동일                                                 |
| `DisposableScope`                           | 재설계. `use`/`defer`/`setTimeout`/`signal`/`dispose`. `adopt`, `delete`, `listen` 제거    |
| `DisposableAbortController`                 | 제거. `scope.signal`을 쓴다. 1.x는 scope에 넣어도 `dispose()` 때 abort되지 않았다          |
| `DisposableTimeout`, `setDisposableTimeout` | 제거. `scope.setTimeout`을 쓴다                                                            |
| `listen`                                    | `addEventListenerWithCleanup`으로 이름 변경. `scope.use(...)`로 등록한다                   |
| `delay(ms, signal, canceledAsError)`        | `sleep(ms, signal)`. abort되면 항상 `AbortError`로 거부한다                                |
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
