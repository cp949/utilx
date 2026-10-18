# Changelog

## Unreleased

### 수정

- `isDeepEqual`: 서로 다른 길이의 순환 구조를 비교할 때 `RangeError: Maximum call stack size exceeded`를 던지던 문제를 고쳤다. 비교한 객체 쌍을 덮어쓰지 않고 모두 기록한다.
  - 전에 예외를 던지던 입력은 이제 `boolean`을 돌려준다. 순환 길이가 달라도 펼친 값이 같으면 `true`, 순환 안의 값이 다르면 `false`다.
  - 예외를 던지지 않던 입력의 결과는 바뀌지 않는다. 공유 참조와 복제 객체를 같게 보는 규칙도 그대로다.
- `moveItem`: 출발 인덱스(`fromIndex`)가 `NaN`이면 `moveItem([], NaN, 0, { inplace: false })`가 `[undefined]`를 만들어 길이를 늘리던 문제를 고쳤다. 정수가 아닌 출발 인덱스(`NaN`, `±Infinity`, 소수)는 이동 없이 반환한다.
  - 비어 있지 않은 배열에서는 전에 `NaN`을 `0`으로 보고 첫 항목을 옮겼다. 이제는 이동하지 않는다.
  - 소수 출발 인덱스는 전에 `splice`가 소수점을 버려 처리했다(예: `1.5`는 `1`). 이제는 이동하지 않는다.
  - 정수 입력의 결과는 바뀌지 않는다. 음수 출발 인덱스와 `toIndex`의 `splice` 보정 규칙도 그대로다.

## 2.1.0

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

## 2.0.0

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
