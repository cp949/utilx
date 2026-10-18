# 브라우저 검증

Node 단위 테스트(`pnpm test`)와 정적 검사(`pnpm check:escompat`)가 확인하지 못하는 동작을 실제 브라우저에서 확인한다. 이 검증은 `pnpm verify`에 포함되지 않는다. 결과는 정적 게이트와 독립해서 보고한다.

## 증거 구분

| project           | 브라우저                                 | 의미                                                                  |
| ----------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `chromium-latest` | Playwright가 관리하는 최신 Chromium      | 최신 브라우저 회귀 검증. Chrome 75 하한의 증거가 아니다               |
| `chrome83`        | podman 컨테이너의 Chromium 83.0.4103.116 | 하한에 가장 가까운 실행 증거. Chrome 75 통과로 해석하지 않는다        |
| (없음)            | Chrome 75                                | 실행하지 않았다. 하한(75)은 `check:escompat`의 정적 검사로만 확인한다 |

Chrome 75를 실행하지 못하는 이유는 Playwright가 페이지 생성 때 호출하는 CDP `Browser.setDownloadBehavior`가 Chrome 82부터 있기 때문이다. Chrome 75를 실행하려면 Playwright를 쓰지 않는 별도 구동 방식이 필요하다. 이 저장소는 그 비용을 아직 조사하지 않았다.

## 실행

```sh
pnpm test:browser            # 최신 Chromium
pnpm test:browser:chrome83   # Chrome 83 컨테이너(podman 필요)
```

- 두 명령은 `pnpm build`를 먼저 실행한다. fixture는 `packages/utilx/dist`를 번들러 없이 그대로 로드한다.
- 최신 Chromium이 없으면 `pnpm exec playwright install chromium`을 실행한다.
- Chrome 83 이미지는 `docker/chrome83/Dockerfile`이다. 빌드에 `snapshot.debian.org`와 `nodejs.org` 접속이 필요하다.
- 실행마다 `test-results/browser-report-<project>.json`을 만든다. 이 파일은 gitignore 대상이다. 브라우저 버전, OS, origin, 권한 조건 중 하나라도 비면 실행이 실패한다.

## 자동화한 시나리오

| 영역            | 시나리오 수 | 확인 내용                                                                                                                                              |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 다운로드        | 7           | 실제 클릭으로 `downloadBlob`(ASCII·한글 파일명, 0~255 바이트), `downloadText`(한글 UTF-8, `mimeType`), `downloadUrl`(이름 지정·생략)의 파일명과 바이트 |
| 이벤트 cleanup  | 4           | capture `true`·`false`·객체 등록 후 해제, capture·bubble 한쪽만 해제, 등록 뒤 옵션 변경, 호출 순서                                                     |
| object URL 수명 | 4           | `downloadBlob`의 40000ms 해제(`page.clock`), `ObjectUrlRegistry`의 acquire·release·revoke·revokeAll·close를 `fetch`로 확인                             |
| 클립보드        | 3           | 권한 허용(쓰기 후 읽기), 권한 거부, 비보안 origin                                                                                                      |
| 프레임 완료     | 2           | 동기 코드 이후·먼저 등록한 rAF 콜백 이후 완료, `await`마다 프레임 1회 이상 경과                                                                        |

## 다운로드 검증 방식

Chrome 83에는 Playwright가 쓰는 CDP 이벤트 `Browser.downloadWillBegin`이 없어 `download` 이벤트가 오지 않는다. 두 project가 같은 경로를 쓰도록 `e2e/fixtures.ts`의 `captureDownload`가 CDP `Browser.setDownloadBehavior`로 저장 위치를 임시 디렉터리로 정하고, 브라우저가 디스크에 저장한 파일의 이름과 바이트를 읽는다. 파일명은 브라우저가 실제로 정한 값이다.

Chrome 83 컨테이너는 `LANG=C.UTF-8`이 필요하다. 로케일이 없으면 한글 파일명을 `download`로 바꿔 저장한다. 이는 컨테이너 환경의 문제이고 utilx 동작이 아니다.

## 실행 조건

| 항목   | 값                                                                                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| origin | 보안 컨텍스트 `http://127.0.0.1:4601`. 비보안 컨텍스트 `http://insecure.test:4601`(`--host-resolver-rules`로 `127.0.0.1`에 매핑)                                             |
| 권한   | `none`(권한을 바꾸지 않음), `granted`(`clipboard-read`·`clipboard-write` 허용), `denied`(`grantPermissions([])`로 모두 거부). 시나리오마다 리포트의 `permissions`에 기록한다 |
| 모드   | 헤드리스. 시나리오마다 새 컨텍스트를 쓴다                                                                                                                                    |

## 마지막 실행 결과

2026-10-19 실행. 같은 소스에서 두 project를 순서대로 실행했다.

| project           | 브라우저               | OS                                                                     | 결과                              |
| ----------------- | ---------------------- | ---------------------------------------------------------------------- | --------------------------------- |
| `chromium-latest` | Chromium 153.0.8010.12 | Ubuntu 22.04.5 LTS, 커널 6.6.114.1-microsoft-standard-WSL2 (WSL2), x64 | 20개 중 통과 20, 실패 0, 건너뜀 0 |
| `chrome83`        | Chromium 83.0.4103.116 | Debian GNU/Linux 10 (buster) 컨테이너(podman), 같은 커널, x64          | 20개 중 통과 20, 실패 0, 건너뜀 0 |

Chrome 75 실행 결과는 없다.

## 수동 시나리오

자동화하지 않은 항목이다. "실행 여부"는 마지막으로 수동 실행한 결과를 적는다. 아직 실행하지 않았으면 `미실행`이다.

| ID  | 시나리오                                                                   | 절차                                                                                                                                                                                                                                 | 기대 결과                                                                                                                                                  | 실행 여부 |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| M1  | 숨김 탭에서 `nextAnimationFrame()`은 탭이 다시 보일 때까지 완료되지 않는다 | fixture를 열고 콘솔에서 `__utilx.nextAnimationFrame().then(() => console.log("done"))`을 실행한 뒤 다른 탭으로 전환한다                                                                                                              | 전환 중에는 `done`이 출력되지 않고, 돌아오면 출력된다                                                                                                      | 미실행    |
| M2  | 사용자 활성화 없이 호출한 `copyTextToClipboard`                            | 콘솔에서 `__utilx.copyTextToClipboard("x").then((r) => console.log(r, document.hasFocus()))`를 실행한다                                                                                                                              | 브라우저와 권한 상태에 따라 `true` 또는 `false`다. 개발자 도구에 포커스가 있으면 `document.hasFocus()`가 `false`라 M3 조건과 겹친다. 두 값을 함께 기록한다 | 미실행    |
| M3  | 문서 포커스가 없을 때 `copyTextToClipboard`                                | 콘솔에서 `setTimeout(() => __utilx.copyTextToClipboard("x").then(console.log), 3000)`을 실행하고 3초 안에 주소창을 클릭한다. 복사 버튼 클릭은 `writeText`를 클릭 중에 동기 호출하므로 클릭 뒤 포커스를 옮겨도 이 조건을 만들 수 없다 | `false`(문서 포커스 없음으로 `writeText`가 거부됨)                                                                                                         | 미실행    |
| M4  | Chrome 75에서 클립보드 정책 차이                                           | Chrome 75 실행 파일로 fixture를 열고 복사 버튼을 누른다                                                                                                                                                                              | 권한 모델이 달라 결과가 다를 수 있다. 결과를 기록한다                                                                                                      | 미실행    |
| M5  | 다른 출처 URL의 `downloadUrl`                                              | 다른 출처의 URL을 `downloadUrl`에 넘긴다                                                                                                                                                                                             | `download` 속성이 무시되어 내려받지 않고 이동할 수 있다. 서버가 `Content-Disposition: attachment`를 보내면 내려받는다                                      | 미실행    |
| M6  | Chrome 75에서 fixture 전체                                                 | Chrome 75로 `http://127.0.0.1:4601`을 열고 `pnpm test:browser`의 시나리오를 손으로 따라 한다                                                                                                                                         | Chrome 83과 같은 결과                                                                                                                                      | 미실행    |
