# 마이그레이션

기존 버전에 따라 아래의 이전 절차를 따른다.

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
