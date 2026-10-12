# @cp949/utilx

브라우저용 문자열, 타입 가드, 값 비교, 경로, 바이너리(Uint8Array), 바이트 표기, 파일명, 버퍼, cleanup scope, blob, 미디어 스트림 유틸. 런타임 의존성 0, Chrome 75 하한(ES2019), ESM 전용이다.

2.0.0은 1.x의 API를 재설계해 이름과 동작이 바뀌었다. 1.x에서 올리는 경우 아래 [1.x에서 옮기기](#1x에서-옮기기)를 따른다.

## 설치

```sh
pnpm add @cp949/utilx
```

진입점은 `@cp949/utilx` 하나다. 사용하지 않는 export는 번들러가 제거한다(`sideEffects: false`).

## 공개 API

| 영역        | export                                                                                                                                                                                                                                                                                                                              | DOM          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 문자열      | `trim`, `trimToUndefined`, `isBlank`, `isNotBlank`                                                                                                                                                                                                                                                                                  | 없음         |
| nil 판별    | `isNil`, `isNotNil`                                                                                                                                                                                                                                                                                                                 | 없음         |
| 타입 가드   | `isString`, `isNumber`, `isBoolean`, `isFunction`, `isPlainObject`, `isNonEmptyArray`, `isPromiseLike`, `isError`                                                                                                                                                                                                                   | 없음         |
| 바이너리    | `isUint8Array`, `toUint8Array`, `concatUint8Arrays`, `areUint8ArraysEqual`, `compareUint8Arrays`, `indexOfUint8Array`, `includesUint8Array`, `stringToUint8Array`, `uint8ArrayToString`, `uint8ArrayToBase64`, `base64ToUint8Array`, `stringToBase64`, `base64ToString`, `uint8ArrayToHex`, `hexToUint8Array`, 타입 `Base64Options` | 없음         |
| 바이트 표기 | `formatByteCount`, 타입 `FormatByteCountOptions`                                                                                                                                                                                                                                                                                    | 없음         |
| 파일명      | `fileExtension`, `fileBaseName`, 타입 `FileExtensionOptions`                                                                                                                                                                                                                                                                        | 없음         |
| 버퍼        | `BoundedBuffer`                                                                                                                                                                                                                                                                                                                     | 없음         |
| cleanup     | `DisposableScope`, `DisposeError`, `addEventListenerWithCleanup`, 타입 `CleanupFn`, `DisposableLike`                                                                                                                                                                                                                                | 타입만       |
| 비동기      | `sleep`                                                                                                                                                                                                                                                                                                                             | 없음         |
| blob        | `downloadBlob`, `ObjectUrlRegistry`                                                                                                                                                                                                                                                                                                 | 호출 시 필요 |
| 미디어      | `stopMediaStream`, `hasGetUserMedia`                                                                                                                                                                                                                                                                                                | 호출 시 필요 |

이름은 `trim`처럼 널리 알려진 것은 그대로 쓰고, 그 밖에는 동작이 보이게 서술적으로 짓는다. 분류가 애매한 함수를 모아 두는 `misc` 같은 영역은 만들지 않는다.

DOM이 필요한 `downloadUrl`, `downloadBlob`, `downloadText`, `ObjectUrlRegistry`, `hasGetUserMedia`는 호출할 때만 `document`, `URL.createObjectURL`, `navigator`에 접근한다. import만으로는 접근하지 않으므로 서버에서 import해도 안전하다.

### 문자열

```ts
import { isBlank, trim, trimToUndefined } from "@cp949/utilx";

trim(undefined); // ''
trimToUndefined("   "); // undefined
isBlank("\u3000"); // true (전각 공백)
```

- 공백 기준은 `String.prototype.trim()`과 같다.
- `isBlank`, `isNotBlank`는 타입 가드가 아니다. `false`일 때 `string`이 아닌 쪽으로 좁혀지는 오류를 피하기 위해서다. 좁힌 값이 필요하면 `trimToUndefined`를 쓴다.

```ts
import {
  camelCase,
  isNumericString,
  limitMaxLength,
  removePrefix,
  replaceAll,
  strlen,
  truncateMiddle,
} from "@cp949/utilx";

strlen(null); // 0
removePrefix("--flag", "-", { repeat: true }); // 'flag'
replaceAll("a.b.c", ".", "/"); // 'a/b/c'
truncateMiddle("This is a long string that needs truncating.", { length: 20 }); // 'This is a...ncating.'
limitMaxLength("a😀b", 2); // 'a' (이모지를 반으로 자르지 않는다)
camelCase("FOO", "bar"); // 'fooBar'
isNumericString("1e3"); // false
```

- `strlen`은 UTF-16 코드 유닛 수(`str.length`)를 돌려준다. 바이트 수나 글자 수가 아니다. `null`/`undefined`는 `0`이다.
- `replaceAll`은 `String.prototype.replaceAll`(Chrome 85)을 쓸 수 없는 환경을 위한 함수다. 정규식과 `$&` 같은 치환 패턴을 해석하지 않는다. 빈 `search`는 아무것도 바꾸지 않는다.
- `removePrefix`, `removeSuffix`의 `repeat` 옵션은 붙어 있는 동안 반복해서 제거한다.
- `limitMaxLength`, `truncateMiddle`은 서로게이트 쌍(이모지 등)을 반으로 자르지 않는다. 결과 길이는 지정한 값 이하다.
- `pascalCase`, `camelCase`, `kebabToPascal`은 각 단어를 소문자로 만든 뒤 첫 글자만 대문자로 한다. 약어도 단어 하나로 취급해서 `'API'`는 `'Api'`가 된다. 로캘은 따르지 않는다.
- `isNumericString`은 부호와 소수점만 허용하는 10진수 표기만 `true`다. 빈 문자열, 공백, 지수(`1e3`), 16진수, `Infinity`는 `false`다. `isDigitString`은 ASCII 숫자만 `true`다. 둘 다 타입 가드가 아니다.

### 값 비교

```ts
import { isDeepEqual, isShallowEqual } from "@cp949/utilx";

isShallowEqual({ a: 1 }, { a: 1 }); // true
isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }); // true
isDeepEqual(new Date(1), new Date(2)); // false
```

- 값은 `Object.is`로 비교한다. `NaN`끼리는 같고 `+0`과 `-0`은 다르다.
- 배열, 평범한 객체는 요소와 키를 비교한다. `isDeepEqual`은 `Date`(시각), `RegExp`, `Map`(값은 깊게), `Set`(요소는 `SameValueZero`)도 비교하고 순환 참조를 처리한다.
- 확신할 수 없으면 다르다고 판정한다. 같은 참조가 아닌 클래스 인스턴스, 함수, TypedArray는 다르다.
- 심볼 키와 프로토타입에서 상속한 키는 비교하지 않는다.

### 경로

```ts
import { joinPath, normalizePath, parsePath } from "@cp949/utilx";

normalizePath("/a//b/../c/./"); // '/a/c/'
joinPath("/a", "b", "../c"); // '/a/c'
parsePath("/home/user/file.tar.gz").ext; // '.gz'
```

- `/`로 구분하는 POSIX 경로 문자열만 다룬다. 파일 시스템에 접근하지 않는다. URL에는 쓰지 않는다(`http://`의 `//`가 합쳐진다).
- Node의 `path.posix`와 같은 결과를 낸다. 길이 6 이하의 `a . /` 조합 1,093개를 `node:path`와 비교하는 테스트가 있다. 예외는 절대 경로 `/..`의 `parsePath`다. Node는 `ext`를 `'.'`으로 돌려주지만 여기서는 `'..'`와 같게 `''`이다.

### nil 판별

```ts
import { isNil, isNotNil } from "@cp949/utilx";

isNil(0); // false
isNil(undefined); // true
const names: string[] = ["a", null, "b"].filter(isNotNil);
```

- nil은 `null`과 `undefined`다. `0`, `''`, `false`, `NaN`은 nil이 아니다.
- 둘 다 타입 가드다. `isNotNil`은 `NonNullable<T>`로 좁힌다.

### 타입 가드

```ts
import { isFunction, isPlainObject, isString } from "@cp949/utilx";

const names: string[] = ["a", 1, "b"].filter(isString);
isPlainObject(new Map()); // false
isFunction(async () => 1); // true
```

- `false`일 때 타입이 틀리게 좁혀지지 않는 정확한 가드만 둔다. 그래서 `NaN`을 거르는 `isNumber`는 없다. `isNumber`는 `typeof value === "number"`이고 `NaN`도 `true`다.
- `isPlainObject`는 객체 리터럴과 `Object.create(null)`만 `true`다. 배열, `Map`, `Date`, 클래스 인스턴스는 `false`다. 다른 realm(iframe)의 평범한 객체는 `true`다.
- `isError`는 다른 realm의 `Error`도 `true`다.
- 이 외 가드(`isDate`, `isEmail`, `isElement` 등)는 두지 않는다. `instanceof`나 `typeof` 한 줄로 충분한 것은 만들지 않는다.

### 바이너리

```ts
import {
  base64ToUint8Array,
  concatUint8Arrays,
  stringToBase64,
  uint8ArrayToHex,
} from "@cp949/utilx";

uint8ArrayToHex(new Uint8Array([0, 15, 255])); // '000fff'
stringToBase64("안녕", { urlSafe: true }); // '7JWI64WV'
base64ToUint8Array("-_8"); // Uint8Array [251, 255]
```

- 모두 `Uint8Array` 기반이다. Node의 `Buffer` 대신 브라우저에서 쓴다.
- base64는 일반과 URL-safe를 모두 읽고, 패딩(`=`)은 없어도 된다. `stringToBase64`는 `btoa`와 달리 한글 등 유니코드를 UTF-8로 인코딩한다.
- `areUint8ArraysEqual`은 상수 시간 비교가 아니다. 토큰이나 MAC 같은 비밀 값 비교에 쓰지 않는다.
- `indexOfUint8Array`는 빈 검색 대상에 `0`을 돌려준다(`String.prototype.indexOf`와 같다).
- 인자 타입은 TypeScript로만 검사한다. 잘못된 base64나 hex는 예외를 던진다(base64는 `DOMException`, hex는 `RangeError`).

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
import { nextAnimationFrame, sleep } from "@cp949/utilx";

await sleep(500);
await sleep(5000, controller.signal); // abort되면 AbortError로 거부
await nextAnimationFrame(); // 다음 requestAnimationFrame까지
```

- `nextAnimationFrame`은 `requestAnimationFrame`이 없으면 `setTimeout(0)` 뒤에 완료한다. 브라우저는 숨겨진 탭에서 프레임을 멈추므로, 그동안은 완료되지 않는다.

### 다운로드·blob

```ts
import {
  downloadBlob,
  downloadText,
  downloadUrl,
  ObjectUrlRegistry,
} from "@cp949/utilx";

downloadUrl("/reports/2026.pdf", "report.pdf");
downloadBlob(new Blob(["hello"], { type: "text/plain" }), "hello.txt");
downloadText("a,b\n1,2", "data.csv", { mimeType: "text/csv;charset=utf-8" });

const registry = new ObjectUrlRegistry();
const url = registry.acquire(file); // 같은 Blob이면 같은 URL, 참조 횟수 +1
registry.release(file); // 0이 되면 revoke
registry.revokeAll(); // 모두 해제, 계속 사용 가능
registry.close(); // 모두 해제하고 닫음, 되돌릴 수 없음
```

- 세 함수 모두 `<a download>` 방식이다. `download` 속성이 없는 환경에서는 동작하지 않는다. 사용자 제스처 안에서 호출해야 한다.
- `downloadUrl`은 같은 출처의 URL, `blob:`, `data:` URL에서 동작한다. 다른 출처의 URL은 브라우저가 `download` 속성을 무시해 내려받지 않고 그 주소로 이동할 수 있다. 이때는 서버가 `Content-Disposition: attachment`를 보내야 한다.
- `downloadBlob`, `downloadText`가 만든 object URL은 40초 뒤에 해제한다.
- `ObjectUrlRegistry`는 GC 때 자동으로 해제하지 않는다. 등록된 Blob은 해제하기 전까지 메모리에 남는다.
- **React StrictMode**: effect cleanup에서 `close()`를 부른 인스턴스를 재실행에서 다시 쓰면 `acquire()`가 예외를 던진다. 인스턴스를 effect 안에서 만들거나 cleanup에서 `revokeAll()`만 부른다.

### 미디어 스트림

```ts
import { hasGetUserMedia, stopMediaStream } from "@cp949/utilx";

if (hasGetUserMedia()) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  // 사용 후
  stopMediaStream(stream); // 카메라 표시등이 꺼진다
}
```

- `stopMediaStream(stream, kind?)`은 트랙을 멈추고 스트림에서 뺀다. `kind`를 `"audio"` 또는 `"video"`로 주면 해당 종류만 처리한다.
- `hasGetUserMedia()`는 `http://` 같은 보안 컨텍스트가 아닌 페이지와 서버에서 `false`다.

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

## @ocodelib/util에서 옮기기

`@ocodelib/util`에서 이어받은 함수의 대응이다. 기능이 같아도 이름과 동작이 바뀐 것이 있다.

| @ocodelib/util                                                                                   | @cp949/utilx                                                                                     |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `trim`, `isBlank`, `isNotBlank`, `strlen`                                                        | `trim`, `isBlank`, `isNotBlank`. `strlen`은 `str.length`를 쓴다. `isBlank`는 타입 가드가 아니다  |
| `trimToUndef`                                                                                    | `trimToUndefined`                                                                                |
| `isNil`, `isNullish`, `isNotNil`                                                                 | `isNil`, `isNotNil`                                                                              |
| `formatByteCount`                                                                                | `formatByteCount`. `NaN`/`Infinity`는 `RangeError`, 옵션 `base`/`units` 추가                     |
| `fileExtension(name, lowerCase, withDot)`                                                        | `fileExtension(name, { lowerCase, withDot })`. 점으로 시작하는 이름(`.bashrc`)은 `null`          |
| `fileNamePart`                                                                                   | `fileBaseName`                                                                                   |
| `downloadBlob`                                                                                   | `downloadBlob`. iOS의 `window.open` 대체 경로는 제거했다. object URL은 40초 뒤에 해제한다        |
| `uint8-array`의 `isUint8Array`, `toUint8Array`                                                   | 같은 이름. `toUint8Array`는 `ArrayBuffer`와 모든 `ArrayBufferView`를 받는다                      |
| `concatUint8Arrays(arrays, totalLength)`                                                         | `concatUint8Arrays(arrays)`. `totalLength` 인자는 제거했다                                       |
| `areUint8ArraysEqual`, `compareUint8Arrays`                                                      | 같은 이름                                                                                        |
| `indexOf`, `includes` (uint8-array)                                                              | `indexOfUint8Array`, `includesUint8Array`. 빈 검색 대상은 `-1` 대신 `0`                          |
| `uint8ArrayToString`, `stringToUint8Array`                                                       | 같은 이름. 기본 인코딩은 `"utf-8"`                                                               |
| `uint8ArrayToBase64`, `base64ToUint8Array`, `stringToBase64`, `base64ToString`                   | 같은 이름                                                                                        |
| `uint8ArrayToHex`, `hexToUint8Array`                                                             | 같은 이름. 잘못된 입력은 `Error` 대신 `RangeError`                                               |
| `assertUint8Array`, `getUintBE`                                                                  | 제거. 런타임 검사 대신 TypeScript 타입을 쓰고, `getUintBE`는 `DataView`로 직접 읽는다            |
| `pusermedia`의 `closeUserMedia`, `closeUserMediaAudioTracks`, `closeUserMediaVideoTracks`        | `stopMediaStream(stream, kind?)` 하나로 합쳤다                                                   |
| `hasGetUserMedia`                                                                                | 같은 이름. 서버에서도 안전하다                                                                   |
| `fixUserMedia`                                                                                   | 제거. import만으로 `window`/`navigator`를 바꾸는 오래된 브라우저용 폴리필이다                    |
| `types`의 `isString`, `isNumber`, `isBoolean`, `isPlainObject`, `isNonEmptyArray`, `isError`     | 같은 이름. `isPlainObject`는 타입 가드로 바꿨고 `isNonEmptyArray`는 `unknown` 대신 배열을 받는다 |
| `types`의 `isFunction`                                                                           | 같은 이름. 기존 구현은 `async` 함수를 `false`로 판정했다                                         |
| `types`의 `isPromise`                                                                            | `isPromiseLike`                                                                                  |
| `types`의 `createTypeGuard`, `createTypeAssertion`, `isUnion`                                    | 제거                                                                                             |
| `types`의 나머지 가드(`isEmail`, `isJSON`, `isBuffer`, `isElement`, Web API, 제너레이터 계열 등) | 제거. `instanceof`/`typeof`로 충분하거나 용도가 좁다                                             |

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

### tree-shaking 지침

사용하지 않는 export가 번들에서 빠지도록 다음을 지킨다. 자동 검사는 없고 리뷰에서 확인한다.

- 모듈 최상위에서 실행되는 코드를 두지 않는다. 상수와 함수, 클래스 선언만 둔다. 모듈 최상위의 `new`, 전역 변경, 정적 초기화 블록(`static {}`)은 금지한다.
- 이름 있는 export만 쓴다. 기본 export와 객체로 묶은 export는 만들지 않는다.
- `package.json`의 `"sideEffects": false`를 유지한다.
- 새 export를 추가하면 그것만 import한 번들에 다른 코드가 딸려 오지 않는지 확인한다. 2.0.0 기준으로 `trim`만 import하면 58바이트(minify, rolldown)다.

Chrome 하한은 `baseline.json` 한 곳에서만 선언한다. 실제 브라우저 실행 검증은 하지 않는다. `check:escompat`은 정적 검사다.

## 라이선스

MIT
