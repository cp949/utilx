# 개발 가이드

Node.js 24 이상과 pnpm이 필요하다. 저장소 루트에서 실행한다.

```sh
pnpm install
pnpm verify
```

`pnpm verify`는 다음을 순서대로 실행한다.

| 명령                   | 검사                                                                                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`            | ESLint. `src/**`의 Node 전역, `Math.random`, 외부 import 금지. DOM 전역은 `src/web`에서만 허용. `globalThis`·`window`·`self` 경유 접근과 `globalThis` 값 전달도 금지                                      |
| `pnpm format:check`    | prettier                                                                                                                                                                                                  |
| `pnpm build`           | `dist`를 지우고 `tsc`로 빌드                                                                                                                                                                              |
| `pnpm check:escompat`  | `dist`가 `baseline.json`의 Chrome 하한(75)과 ES2019 기준을 만족하는지. `dist/web` 밖의 DOM 전역과 전역 객체 경유 접근도 검사                                                                              |
| `pnpm check:deps`      | 소스와 tarball의 런타임 의존성이 0인지                                                                                                                                                                    |
| `pnpm check:readme`    | 패키지 README가 루트 README와 byte 단위로 같은지, 루트 README에 상대 링크가 없는지. 원본은 루트 README이고 `pnpm sync:readme`로 맞춘다                                                                    |
| `pnpm check:consumer`  | tarball을 임시 `node_modules`에 풀어 패키지 이름으로 소비. 파일 집합, exports, 상대 경로, DOM 없는 ESM import, TypeScript 컴파일(`nodenext`·`bundler`)                                                    |
| `pnpm check:bundle`    | tarball을 esbuild로 번들해 `trim`·`moveItem`·`DisposableScope` 단일 import에 남은 모듈을 `bundle-baseline.json`과 대조. `sideEffects: false` 선언, 금지 디렉터리 모듈, 선언에 가려진 최상위 부작용도 검사 |
| `pnpm test:gates`      | 위 게이트와 `baseline.json` 검증의 허용·금지 fixture 검사. 게이트가 위반을 실제로 잡는지 확인                                                                                                             |
| `pnpm check-types`     | 소스와 테스트의 타입 검사                                                                                                                                                                                 |
| `pnpm check-types:e2e` | 브라우저 검증 코드(`e2e/`, `playwright.config.ts`)의 타입 검사                                                                                                                                            |
| `pnpm test`            | 단위 테스트와 성질 검사(`test/property`). 성질 검사는 작은 입력 공간을 전수 열거하며 난수를 쓰지 않는다                                                                                                   |

## 큰 탐색

`pnpm verify`는 임의 입력 탐색을 실행하지 않는다. `pnpm test:explore`가 `fast-check`로 `test/explore`의 성질을 임의 입력에 대해 검사한다. 대상은 `moveItem`·`rotateLeft`·`rotateRight`·`swapItems`, `isDeepEqual`, `DisposableScope`, base64·hex·`toUint8Array`다.

| 환경 변수      | 기본값          | 의미                                              |
| -------------- | --------------- | ------------------------------------------------- |
| `EXPLORE_RUNS` | `1000`          | 성질마다 실행하는 입력 수                         |
| `EXPLORE_SEED` | 실행마다 무작위 | 시작 시 출력한다. 지정하면 같은 입력열을 재현한다 |

실패하면 seed와 축소된 반례가 출력된다. 같은 입력은 `EXPLORE_SEED=<seed> EXPLORE_RUNS=<runs> pnpm test:explore`로 다시 만든다. 확정한 반례는 `test/`의 단건 회귀 테스트로 옮긴다.

## 브라우저 검증

`pnpm verify`는 브라우저를 실행하지 않는다. 실제 브라우저 검증은 별도 명령이다. 두 명령 모두 `pnpm build`를 먼저 실행한다.

| 명령                         | 실행 환경                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm test:browser`          | Playwright가 관리하는 최신 Chromium. 브라우저가 없으면 `pnpm exec playwright install chromium`  |
| `pnpm test:browser:chrome83` | podman 컨테이너의 Chrome 83(`docker/chrome83`). podman이 없으면 docker로 대체하지 않고 실패한다 |

Chrome 75는 실행하지 않는다. Playwright가 Chrome 82 이상을 요구하므로 Chrome 83이 실행 가능한 가장 낮은 버전이다. 하한(75)은 `check:escompat`의 정적 검사로만 확인한다. 시나리오, 실행 조건 기록, 수동 시나리오는 [docs/browser-verification.md](https://github.com/cp949/utilx/blob/main/docs/browser-verification.md)에 있다.

## 배포

`main` 또는 `dev` 브랜치의 루트에서 실행한다. 루트 script가 `packages/utilx`로 이동해 release-it을 실행한다. 설정은 `packages/utilx/.release-it.json`에 있다.

```sh
GITHUB_TOKEN=$(gh auth token) pnpm release-it
```

1. `pnpm verify`를 실행하고 npm 인증을 확인한다.
2. 새 버전을 고르면 `packages/utilx/package.json`의 version을 올리고, 루트 `CHANGELOG.md`의 `## [Unreleased]`를 `## [<version>] - <날짜>`로 바꾼다. 위에는 빈 `## [Unreleased]`를 다시 만든다.
3. `pnpm publish`로 npm에 배포한다. npm이 OTP를 요구하면 입력을 묻고 다시 시도한다. 같은 버전이 이미 있으면 실패하고 커밋·태그를 만들지 않는다.
4. `chore: v<version> 배포` 커밋, `v<version>` 태그를 만들어 push하고 GitHub Release를 만든다. 본문은 CHANGELOG의 해당 버전 항목이다.

배포 전에 `## [Unreleased]` 아래에 변경 내역을 적는다. 비어 있으면 버전을 고르기 전에 실패한다. `GITHUB_TOKEN`이 없으면 GitHub Release는 웹 화면 링크로 대신한다. `pnpm release-it --dry-run`은 hook과 파일 변경 없이 절차만 출력한다.

## 소스 파일 규칙

- 공개 함수와 클래스는 파일 하나에 하나씩 두고, 파일명은 이름과 같다(`trim.ts`, `ObjectUrlRegistry.ts`).
- 공개 심볼 하나만 쓰는 타입과 helper는 그 파일에 둔다. 둘 이상이 쓰는 공개 타입은 타입 이름으로 파일을 만든다(`ArrayInPlaceOptions.ts`).
- 여러 공개 파일이 쓰는 내부 helper 파일에는 `.internal.ts` suffix를 붙인다. 디렉터리의 `index.ts`에서 re-export하지 않는다.
- 디렉터리의 `index.ts`는 공개 파일을 `export *`로 모은다.

## tree-shaking 지침

사용하지 않는 export가 번들에서 빠지도록 다음을 지킨다.

- 모듈 최상위에서 실행되는 코드를 두지 않는다. 상수와 함수, 클래스 선언만 둔다. 모듈 최상위의 `new`, 전역 변경, 정적 초기화 블록(`static {}`)은 금지한다.
- 이름 있는 export만 쓴다. 기본 export와 객체로 묶은 export는 만들지 않는다.
- `package.json`의 `"sideEffects": false`를 유지한다.
- 새 export를 추가하면 그것만 import한 번들에 다른 코드가 딸려 오지 않는지 확인한다.

`pnpm check:bundle`은 `trim`, `moveItem`, `DisposableScope` 단일 import와 `downloadBlob` 대조군, 전체 import를 esbuild(버전·`target`·`minify`는 `bundle-baseline.json`에 기록)로 번들해 포함 모듈 목록을 검사한다. 나머지 export는 리뷰에서 확인한다.

- 포함 모듈 목록은 baseline과 정확히 같아야 한다. 의도한 변경이면 `pnpm sync:bundle`로 baseline을 다시 만든다. 금지 디렉터리 모듈, `sideEffects: false` 누락, 선언에 가려진 최상위 부작용이 있으면 baseline을 쓰지 않는다.
- baseline의 raw·gzip bytes는 기록만 하며 한도가 아니다. 크기 예산은 정하지 않았다.

Chrome 하한은 `baseline.json` 한 곳에서만 선언한다. `check:escompat`은 정적 검사이고, Chrome 75를 직접 실행한 검증은 없다. 최신 Chromium과 Chrome 83의 실행 검증은 [브라우저 검증](#브라우저-검증)을 따른다.
