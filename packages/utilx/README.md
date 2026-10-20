# @cp949/utilx

[![npm version](https://img.shields.io/npm/v/@cp949/utilx)](https://www.npmjs.com/package/@cp949/utilx)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/cp949/utilx/blob/main/LICENSE)

브라우저 애플리케이션에서 반복되는 데이터 처리와 리소스 정리를 위한 JavaScript·TypeScript 유틸리티 라이브러리.

- 문자열과 배열, 숫자 파싱부터 파일 다운로드와 이벤트 정리까지 다룬다.
- 런타임 의존성이 없으며 ESM으로 제공한다. `sideEffects: false`를 선언해 번들러가 사용하지 않는 export를 제거할 수 있다.
- TypeScript 타입 선언을 제공한다. 타입 가드로 값을 좁히고, 배열 수정 여부는 호출할 때 `inplace` 옵션으로 명시한다.
- Chrome 75·ES2019를 호환성 기준으로 삼는다. Chrome 75는 정적 검사로 확인하며, 브라우저 실행 검증 범위는 [브라우저 검증 문서](https://github.com/cp949/utilx/blob/main/docs/browser-verification.md)에 기록한다.

[API 가이드](https://github.com/cp949/utilx/blob/main/docs/api.md) · [마이그레이션](https://github.com/cp949/utilx/blob/main/docs/migration.md) · [변경 내역](https://github.com/cp949/utilx/blob/main/CHANGELOG.md)

## 설치

```sh
npm install @cp949/utilx
```

```sh
pnpm add @cp949/utilx
```

## 사용 예제

필요한 함수만 `@cp949/utilx`에서 가져온다.

```ts
import { parseIntegerOrUndefined, trimToUndefined, uniq } from "@cp949/utilx";

// 빈 입력은 undefined로 구분한다.
trimToUndefined("  hello  "); // 'hello'
trimToUndefined("   "); // undefined
parseIntegerOrUndefined("42", { min: 1, max: 100 }); // 42
parseIntegerOrUndefined("12abc"); // undefined

// 원본 배열을 유지하고 중복을 제거한다.
const tags = ["TypeScript", "JavaScript", "TypeScript"];
const uniqueTags = uniq(tags, { inplace: false });

console.log(uniqueTags); // ['TypeScript', 'JavaScript']
console.log(tags); // ['TypeScript', 'JavaScript', 'TypeScript']
```

더 많은 예제와 함수별 동작 규칙은 [API 가이드](https://github.com/cp949/utilx/blob/main/docs/api.md)에서 확인한다.

## 사용 환경

ESM 전용이며 공개 진입점은 `@cp949/utilx` 하나다. TypeScript에서는 `lib`에 `"DOM"`이 필요하며, 모듈 해석은 `nodenext`와 `bundler`를 지원한다. `node10`은 지원하지 않는다.

import만으로는 DOM에 접근하지 않아 서버에서도 import할 수 있다. 다운로드·클립보드 등 Web API를 사용하는 기능은 해당 API가 있는 환경에서 호출해야 한다.

1.x와 2.x는 API 이름과 동작이 다르다. 기존 사용자는 [마이그레이션 가이드](https://github.com/cp949/utilx/blob/main/docs/migration.md)를 먼저 확인한다.

## 기여

버그 보고와 개선 제안은 [GitHub Issues](https://github.com/cp949/utilx/issues)에 남긴다. 개발 환경, 검증 명령과 소스 작성 규칙은 [개발 가이드](https://github.com/cp949/utilx/blob/main/docs/development.md)를 참고한다.

## 라이선스

[MIT](https://github.com/cp949/utilx/blob/main/LICENSE)
