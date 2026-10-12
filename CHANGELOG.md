# Changelog

## 2.0.0

패키지를 새로 시작했다. 1.x의 API를 모두 제거하므로 메이저 버전을 올린다.

### Breaking Changes

- `DisposableScope`, `DisposableAbortController`, `DisposableTimeout`, `listen`, `delay`, `setDisposableTimeout`, `URLCreateRegistry`, `BoundedBuffer`, `genId`, `genUid`를 제거했다.
- `genId`, `genUid`는 `@cp949/random/id`로 대체한다.

### 추가

- `@cp949/utilx/string`: `trim`, `trimToUndef`, `isBlank`, `isNotBlank`
- `@cp949/utilx/bytes`: `formatByteCount`
- `@cp949/utilx/file`: `fileExtension`, `fileBaseName`
- `@cp949/utilx/web`: `downloadBlob`
- 빌드 타깃은 ES2019, 브라우저 하한은 Chrome 75다.
