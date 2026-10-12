# Changelog

## 2.0.0

패키지를 재구성했다. 1.x의 `genId`, `genUid`를 제거하고 나머지 API 일부를 재설계하므로 메이저 버전을 올린다.
이전 API와의 대응은 README의 "1.x에서 옮기기"를 따른다.

### Breaking Changes

- `genId`, `genUid`를 제거했다. `@cp949/random/id`로 대체한다.
- `DisposableAbortController`, `DisposableTimeout`, `setDisposableTimeout`을 제거했다. `DisposableScope.signal`과 `DisposableScope.setTimeout`으로 대체한다.
- `DisposableScope`에서 `adopt`, `delete`, `listen`을 제거했다. `listen`은 함수로 남기고 `scope.use(listen(...))`로 등록한다.
- `DisposableScope.dispose()`는 cleanup이 던진 예외를 삼키지 않고 `DisposeError`로 모아서 던진다.
- `DisposableLike`는 함수이거나 `dispose()`를 가진 객체만 받는다. `close`, `unsubscribe`, `abort` 등 이름 기반 판별을 제거했다.
- `delay(ms, signal, canceledAsError)`를 `delay(ms, signal)`로 바꿨다. abort되면 `AbortError`로 거부한다.
- `BoundedBuffer`의 `shift`, `peekOldest`, `peekNewest`가 빈 버퍼에서 `null` 대신 `undefined`를 돌려준다. 잘못된 `maxSize`는 `RangeError`다.
- `URLCreateRegistry`를 `@cp949/utilx/web`로 옮겼다.
- 빌드 타깃을 ES2022에서 ES2019로 낮췄다. 브라우저 하한은 Chrome 75다.

### 수정

- `DisposableScope`에 등록한 `DisposableAbortController`가 `dispose()` 때 abort되지 않던 문제를 `scope.signal`로 해결했다.

### 추가

- subpath export: `/string`, `/bytes`, `/file`, `/buffer`, `/disposable`, `/async`, `/web`
- `trim`, `trimToUndef`, `isBlank`, `isNotBlank`
- `formatByteCount`
- `fileExtension`, `fileBaseName`
- `downloadBlob`
- `DisposableScope.defer`, `DisposableScope.signal`
