# Changelog

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
- `downloadBlob`
- `DisposableScope.defer`, `DisposableScope.signal`
- 타입 가드: `isString`, `isNumber`, `isBoolean`, `isFunction`, `isPlainObject`, `isNonEmptyArray`, `isPromiseLike`, `isError`
- 바이너리: `isUint8Array`, `toUint8Array`, `concatUint8Arrays`, `areUint8ArraysEqual`, `compareUint8Arrays`, `indexOfUint8Array`, `includesUint8Array`, `stringToUint8Array`, `uint8ArrayToString`, `uint8ArrayToBase64`, `base64ToUint8Array`, `stringToBase64`, `base64ToString`, `uint8ArrayToHex`, `hexToUint8Array`
- 미디어: `stopMediaStream`, `hasGetUserMedia`
- `@ocodelib/util`에서 이어받은 함수의 대응표를 README에 추가했다.
