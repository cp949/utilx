# Changelog

## [Unreleased]

### 추가

- `firstNotBlank`, `firstNotEmpty`: 여러 후보 중 값이 있는 첫 문자열을 고른다.
  - 시그니처는 `(...values: readonly (string | null | undefined)[]) => string | undefined`다.
  - `firstNotBlank`는 `trim` 기준으로 공백뿐인 문자열을 건너뛰고, 찾은 문자열은 원본 그대로 돌려준다.
  - `firstNotEmpty`는 길이가 0인 문자열만 건너뛴다.
- `firstNotNil`: 인자 중 `null`도 `undefined`도 아닌 첫 값을 고른다.
  - 시그니처는 `<T>(...values: readonly T[]) => NonNullable<T> | undefined`다.
  - `0`, `''`, `false`, `NaN`은 nil이 아니므로 돌려준다.
- `isVisuallyBlank`, `isNotVisuallyBlank`: 값이 없거나 화면에 보이는 글자가 없으면 blank로 판정한다.
  - `\p{White_Space}`, `\p{Default_Ignorable_Code_Point}`, `U+2800`만으로 이루어진 문자열을 blank로 본다. 제로 너비 문자, 소프트 하이픈, 한글 채움 문자(`U+3164`)가 해당한다. `isBlank`는 이 문자들을 blank로 보지 않는다.
  - 타입 가드가 아니다. 빈 문자열에서 `false`일 때 `string`이 `null | undefined`로 잘못 좁혀지는 것을 피하기 위해 `boolean`을 돌려준다.
- `escapeHtml`, `escapeStringRegexp`: HTML 텍스트와 `RegExp` 패턴에 문자열을 글자 그대로 넣기 위한 이스케이프다.
  - `escapeStringRegexp`는 sindresorhus/escape-string-regexp(MIT)와 같은 규칙이다.
- `chunk`: 배열을 `size`개씩 잘라 새 배열의 배열로 돌려준다. `size`가 1 이상의 정수가 아니면 `RangeError`다.
- `splitFirst`, `splitLast`: 처음 또는 마지막 구분자로 문자열을 `[앞, 뒤]`로 나눈다.
  - 구분자는 여러 글자여도 되고 구분자 길이만큼 건너뛴다. `splitFirst('a::b', '::')`은 `['a', 'b']`다.
  - 구분자가 없을 때 뒤쪽은 `undefined`다. 빈 구분자는 없는 것으로 본다.
- `substringBefore`, `substringBeforeLast`, `substringAfter`, `substringAfterLast`: 구분자 앞 또는 뒤의 부분 문자열을 돌려준다.
  - 구분자가 없거나 빈 문자열이면 `missingDelimiterValue`를 돌려준다. 생략(`undefined`)하면 `text` 전체이고, `''`를 넘기면 `''`다.
- `clamp`: 수를 `min` 이상 `max` 이하로 맞춘다. `min > max`이면 두 값을 바꿔서 처리하고, `min`이나 `max`가 `NaN`이면 `RangeError`를 던진다.

## [2.1.1] - 2026-10-19

### 수정

- `isDeepEqual`: 서로 다른 길이의 순환 구조를 비교할 때 `RangeError: Maximum call stack size exceeded`를 던지던 문제를 고쳤다. 비교한 객체 쌍을 덮어쓰지 않고 모두 기록한다.
  - 전에 예외를 던지던 입력은 이제 `boolean`을 돌려준다. 순환 길이가 달라도 펼친 값이 같으면 `true`, 순환 안의 값이 다르면 `false`다.
  - 예외를 던지지 않던 입력의 결과는 바뀌지 않는다. 공유 참조와 복제 객체를 같게 보는 규칙도 그대로다.
- `moveItem`: 출발 인덱스(`fromIndex`)가 `NaN`이면 `moveItem([], NaN, 0, { inplace: false })`가 `[undefined]`를 만들어 길이를 늘리던 문제를 고쳤다. 정수가 아닌 출발 인덱스(`NaN`, `±Infinity`, 소수)는 이동 없이 반환한다.
  - 비어 있지 않은 배열에서는 전에 `NaN`을 `0`으로 보고 첫 항목을 옮겼다. 이제는 이동하지 않는다.
  - 소수 출발 인덱스는 전에 `splice`가 소수점을 버려 처리했다(예: `1.5`는 `1`). 이제는 이동하지 않는다.
  - 정수 입력의 결과는 바뀌지 않는다. 음수 출발 인덱스와 `toIndex`의 `splice` 보정 규칙도 그대로다.
- `addEventListenerWithCleanup`: 등록 후 옵션 객체의 `capture`를 바꾸면 cleanup이 리스너를 해제하지 못하던 문제를 고쳤다. 등록 시점의 `capture`를 보관해 해제에 쓴다.
  - 시그니처는 바뀌지 않는다. `once`, `passive`, `signal`은 등록 때 원본 옵션을 그대로 넘기므로 의미가 그대로다.
  - cleanup은 `removeEventListener`에 `{ capture }` 객체를 넘긴다. 전에는 등록에 쓴 옵션 객체를 그대로 넘겼다.
  - Node `EventTarget`은 `removeEventListener`의 boolean `true`를 capture로 보지 않는다(Node 24.20.0에서 확인). 그래서 전에는 옵션 `true`로 등록한 리스너를 Node에서 해제하지 못했다. 이 경우도 함께 고쳐진다.
- `swapItems`: 길이를 더하면 부동소수 반올림으로 정수가 되는 음수 소수 인덱스(예: 길이 3에서 `-0.9999999999999999`)를 정수로 보고 항목을 바꾸던 문제를 고쳤다. 이제 정수가 아닌 인덱스는 길이를 더하기 전에 거른다.
- `isUint8Array`: `Symbol.toStringTag`만 위장한 객체와 태그를 위장한 `Uint16Array` 같은 다른 TypedArray를 `true`로 판정하던 문제를 고쳤다. 이제 TypedArray 내부 슬롯(`%TypedArray%.prototype[Symbol.toStringTag]` getter)으로 판별한다.
  - 진짜 `Uint8Array`, 다른 realm의 `Uint8Array`, `Buffer`는 계속 `true`다.
  - `instanceof Uint8Array`만 통과하던 객체는 전에 `true`였고, 이제 `false`다. `Object.setPrototypeOf(new Uint16Array(1), Uint8Array.prototype)`처럼 프로토타입만 바꾼 다른 TypedArray, `Object.create(Uint8Array.prototype)`, `new Proxy(new Uint8Array(1), {})`가 해당한다. 앞의 것은 내부가 `Uint16Array`이고, 뒤의 둘은 `subarray` 같은 TypedArray 메서드 호출에서 `TypeError`가 난다.
  - 전에 throwing getter와 revoked Proxy 입력에서 던지던 예외가 사라지고 `false`를 돌려준다.
- `isError`: `Symbol.toStringTag`만 `"Error"`로 위장한 객체를 `true`로 판정하던 문제를 고쳤다. 다른 realm 객체는 `[object Error]` 태그에 더해 `Symbol.toStringTag` 속성이 없어야 `true`다.
  - 같은 realm의 `Error`와 다른 realm의 진짜 `Error`는 계속 `true`다. `Symbol.toStringTag`를 직접 정의한 다른 realm의 `Error`는 이제 `false`다.
  - 전에 throwing getter와 revoked Proxy 입력에서 던지던 예외가 사라지고 `false`를 돌려준다.
  - 의도적으로 만든 Proxy는 여전히 걸러내지 못한다. 모든 임의 객체를 안전하게 판별한다는 보장은 없다.
- `toError`: 위장 객체가 `isError`를 통과해 `message`가 `undefined`인 채 그대로 반환되던 문제는 `isError` 수정으로 해결된다. 위장 객체는 이제 새 `Error`로 감싸고 원본을 `cause`에 담는다.
  - `isError`가 `true`인 값은 전과 같이 같은 인스턴스를 돌려준다. `message` 등 필드 값은 검증하지 않는다.

### 변경

- `DisposableScope.dispose()`: `signal`을 cleanup보다 먼저 abort한다. 전에는 cleanup을 모두 실행한 뒤 abort했다.
  - cleanup 중 `signal.aborted`는 항상 `true`다. 전에는 `signal`을 먼저 읽었으면 `false`, 읽지 않았으면 `true`였다.
  - 동기 abort 리스너는 모든 cleanup보다 먼저 실행된다. 전에는 모든 cleanup 뒤에 실행됐다. 리스너가 cleanup 결과에 의존하면 동작이 바뀐다.
  - `abort()`가 동기 예외를 던지는 구현이어도 cleanup은 모두 실행한다. 그 예외는 `DisposeError.errors`의 맨 앞에 담긴다. 규격상 abort 리스너의 예외는 `DisposeError`에 모이지 않고 전역에 보고된다.
  - 반복 `dispose()`, abort 리스너와 cleanup 안의 `dispose()` 재진입, `dispose()` 시작 뒤의 등록(대상을 즉시 정리하고 예외를 던진다)은 전과 같다.

### 문서

- `BoundedBuffer`: JSDoc의 "모든 연산은 O(1)"을 정정했다. `push`, `shift`, `peek*`, `clear`는 O(1), `setMaxSize`로 줄이면 제거하는 항목 수 k에 대해 O(k), `toArray`, `clone`, 반복은 O(n)이다. 구현은 바뀌지 않았다.
- `truncateMiddle`: `omission`이 `length` 이상이면 UTF-16 코드 유닛 기준으로 잘라 서로게이트 쌍이 잘릴 수 있다는 예외를 JSDoc에 추가했다. README에는 이미 있던 내용이다. 동작은 바뀌지 않았다.
- `isDeepEqual`: `Map`의 키를 `SameValueZero`로 찾고 값만 재귀 비교한다는 계약을 JSDoc과 README에 명시했다. 객체 키는 같은 참조여야 한다. 동작은 바뀌지 않았다.
- 패키지 README를 루트 README와 같은 내용으로 맞추고 `pnpm check:readme`(`pnpm verify`에 포함)로 일치와 상대 링크 부재를 검사한다. 루트 README가 원본이며 `pnpm sync:readme`로 동기화한다. 루트 README의 `docs/` 상대 링크는 npm에서 깨지므로 GitHub 절대 URL로 바꿨다.

## [2.1.0]

### 추가

- 배열: `appendUnique`, `prependUnique`, `removeFirst`, `updateFirst`, `moveItem`, `swapItems`, `swapValues`, `rotateLeft`, `rotateRight`, `uniq`, `uniqBy`, `limitItems`, `lengthOf`, `isEmpty`, `isNotEmpty`, `firstItem`, `firstItems`, `lastItem`, `lastItems`, `isValidIndexRange`, `zipMap`, 타입 `ArrayInPlaceOptions`, `ArrayCopyOptions`
  - 배열을 바꾸는 함수는 마지막 인자 `{ inplace: true | false }`가 필수다. `true`는 전달한 배열을 직접 수정하고, `false`는 새 배열을 돌려준다. 읽기만 하는 `lengthOf`, `isEmpty`, `isNotEmpty`, `firstItem`, `firstItems`, `lastItem`, `lastItems`, `isValidIndexRange`, `zipMap`은 받지 않는다.
  - `@ocodelib/util`의 `array` 영역에서 쓰던 `append`, `prepend`, `remove`, `replace`, `move`, `swap`, `swapValue`, `shiftRotateLeft`, `shiftRotateRight`, `uniq`, `uniqBy`, `truncate`, `size`, `last`, `lastOne`, `first`, `firstOne`, `isEmpty`, `isNotEmpty`, `isValidRange`, `zipWith`와 `$` 접두어 복사본 함수를 대체한다. 대응은 README의 "@ocodelib/util에서 옮기기"를 따른다.
- 숫자: `parseNumberOrUndefined`, `parseIntegerOrUndefined`, 타입 `ParseIntegerOptions`
  - 10진수 표기(`isNumericString`과 같은 규칙)만 받는다. 빈 문자열은 `0`이 아니라 `undefined`다. 정수 판정은 변환된 수 값 기준이고 `Number.isSafeInteger`를 벗어나면 `undefined`다.
- 오류 값: `extractErrorMessage`, `toError`, 타입 `ErrorWithCause`
  - 둘 다 예외를 던지지 않는다. `toError`는 `isError`로 판정하므로 다른 realm의 `Error`를 보존하고, 그 외 값은 새 `Error`로 감싸 원래 값을 `cause`에 담는다.
- URL: `joinUrl`
  - 빈 문자열 조각은 건너뛴다. 조각이 없거나 모두 비어 있으면 빈 문자열을 반환한다. 첫 조각이 `#`/`?`로 시작하거나 `#`이 둘 이상인 입력도 처리한다. 문자열 조각을 가변 인자로 받고, 배열 단일 인자는 받지 않는다.
- 단언: `invariant`. 예외 `name`은 `'Invariant Violation'`이다.
- blob: `blobToFile`, 타입 `BlobToFileOptions`
- 클립보드: `copyTextToClipboard`. 실패하면 예외 대신 `false`를 돌려준다.
- 바이트 표기: `formatByteCountToParts`, `byteCountInUnit`, 타입 `ByteCountParts`, `ByteCountInUnitOptions`
  - `formatByteCount` 옵션에 `fractionDigits`, `unit`을 추가했다. 옵션을 지정하지 않은 출력은 바뀌지 않는다.

### 변경

- 공개 함수와 클래스를 이름에 맞는 개별 소스 파일로 분리했다. 공개 import 진입점은 `@cp949/utilx`로 유지한다.

## [2.0.0]

패키지를 재구성했다. 1.x의 `genId`, `genUid`를 제거하고 나머지 API를 재설계하므로 메이저 버전을 올린다.
이전 API와의 대응은 README의 "1.x에서 옮기기"를 따른다.

### Breaking Changes

- 서브패스를 두지 않고 `@cp949/utilx` 하나로 import한다.
- `genId`, `genUid`를 제거했다. `@cp949/random/id`로 대체한다.
- 이름 변경: `listen`은 `addEventListenerWithCleanup`, `delay`는 `sleep`, `URLCreateRegistry`는 `ObjectUrlRegistry`다.
- `DisposableAbortController`, `DisposableTimeout`, `setDisposableTimeout`을 제거했다. `DisposableScope.signal`과 `DisposableScope.setTimeout`으로 대체한다.
- `DisposableScope`에서 `adopt`, `delete`, `listen`을 제거했다. 이벤트 리스너는 `scope.use(addEventListenerWithCleanup(...))`로 등록한다.
- `DisposableScope.dispose()`는 cleanup이 던진 예외를 삼키지 않고 `DisposeError`로 모아서 던진다.
- `DisposableLike`는 함수이거나 `dispose()`를 가진 객체만 받는다. `close`, `unsubscribe`, `abort` 등 이름 기반 판별을 제거했다.
- `delay(ms, signal, canceledAsError)`를 `sleep(ms, signal)`로 바꿨다. abort되면 `AbortError`로 거부한다.
- `BoundedBuffer`의 `shift`, `peekOldest`, `peekNewest`가 빈 버퍼에서 `null` 대신 `undefined`를 돌려준다. 잘못된 `maxSize`는 `RangeError`다.
- 빌드 타깃을 ES2022에서 ES2019로 낮췄다. 브라우저 하한은 Chrome 75다.

### 수정

- `DisposableScope`에 등록한 `DisposableAbortController`가 `dispose()` 때 abort되지 않던 문제를 `scope.signal`로 해결했다.

### 추가

- `trim`, `trimToUndefined`, `isBlank`, `isNotBlank`
- `isNil`, `isNotNil`
- `formatByteCount`
- `fileExtension`, `fileBaseName`
- `downloadUrl`, `downloadBlob`, `downloadText`
- `DisposableScope.defer`, `DisposableScope.signal`
- 타입 가드: `isString`, `isNumber`, `isBoolean`, `isFunction`, `isPlainObject`, `isNonEmptyArray`, `isPromiseLike`, `isError`
- 바이너리: `isUint8Array`, `toUint8Array`, `concatUint8Arrays`, `areUint8ArraysEqual`, `compareUint8Arrays`, `indexOfUint8Array`, `includesUint8Array`, `stringToUint8Array`, `uint8ArrayToString`, `uint8ArrayToBase64`, `base64ToUint8Array`, `stringToBase64`, `base64ToString`, `uint8ArrayToHex`, `hexToUint8Array`
- 미디어: `stopMediaStream`, `hasGetUserMedia`
- 문자열: `strlen`, `limitMaxLength`, `truncateMiddle`, `removePrefix`, `removeSuffix`, `removeSurrounding`, `replaceAll`, `capitalize`, `uncapitalize`, `camelCase`, `pascalCase`, `kebabToPascal`, `kebabToConstant`, `isNumericString`, `isDigitString`
- 값 비교: `isShallowEqual`, `isDeepEqual`
- 경로: `normalizePath`, `joinPath`, `isAbsolutePath`, `parsePath`
- 비동기: `nextAnimationFrame`
- `@ocodelib/util`에서 이어받은 함수의 대응표를 README에 추가했다.
