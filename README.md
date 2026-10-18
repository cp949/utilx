# @cp949/utilx

브라우저용 문자열, 숫자 파싱, 타입 가드·단언, 오류 값, 값 비교, 경로, URL, 배열 수정, 바이너리(Uint8Array), 바이트 표기, 파일명, 버퍼, cleanup scope, blob, 클립보드, 미디어 스트림 유틸. 런타임 의존성 0, Chrome 75 하한(ES2019), ESM 전용이다.

2.0.0은 1.x의 API를 재설계해 이름과 동작이 바뀌었다. 1.x에서 올리는 경우 아래 [1.x에서 옮기기](#1x에서-옮기기)를 따른다.

## 설치

```sh
pnpm add @cp949/utilx
```

진입점은 `@cp949/utilx` 하나다. 사용하지 않는 export는 번들러가 제거한다(`sideEffects: false`).

## 영역별 대표 API

아래 표는 영역별 대표 API만 소개한다. 전체 공개 export는 [소스 진입점과 영역별 index.ts](https://github.com/cp949/utilx/blob/main/packages/utilx/src/index.ts)에서 확인한다.

| 영역           | 대표 API                                                                         |
| -------------- | -------------------------------------------------------------------------------- |
| 문자열         | `trim`, `isBlank`, `camelCase`, `truncateMiddle`                                 |
| nil 판별       | `isNil`, `isNotNil`                                                              |
| 배열           | `appendUnique`, `moveItem`, `uniq`, `firstItem`, `zipMap`                        |
| 숫자           | `parseNumberOrUndefined`, `parseIntegerOrUndefined`                              |
| 타입 가드·단언 | `isString`, `isPlainObject`, `invariant`                                         |
| 오류 값        | `extractErrorMessage`, `toError`                                                 |
| 값 비교        | `isShallowEqual`, `isDeepEqual`                                                  |
| 경로           | `normalizePath`, `joinPath`, `parsePath`                                         |
| 바이너리       | `toUint8Array`, `stringToBase64`, `hexToUint8Array`                              |
| 바이트 표기    | `formatByteCount`, `formatByteCountToParts`, `byteCountInUnit`                   |
| URL            | `joinUrl`                                                                        |
| 파일명         | `fileExtension`, `fileBaseName`                                                  |
| 버퍼           | `BoundedBuffer`                                                                  |
| cleanup        | `DisposableScope`, `addEventListenerWithCleanup`                                 |
| 비동기         | `sleep`, `nextAnimationFrame`                                                    |
| 다운로드·blob  | `downloadUrl`, `downloadBlob`, `downloadText`, `blobToFile`, `ObjectUrlRegistry` |
| 클립보드       | `copyTextToClipboard`                                                            |
| 미디어         | `stopMediaStream`, `hasGetUserMedia`                                             |

이름은 `trim`처럼 널리 알려진 것은 그대로 쓰고, 그 밖에는 동작이 보이게 서술적으로 짓는다. 분류가 애매한 함수를 모아 두는 `misc` 같은 영역은 만들지 않는다.

DOM이 필요한 `downloadUrl`, `downloadBlob`, `downloadText`, `blobToFile`, `copyTextToClipboard`, `ObjectUrlRegistry`, `hasGetUserMedia`는 호출할 때만 `document`, `URL.createObjectURL`, `File`, `navigator`에 접근한다. import만으로는 접근하지 않으므로 서버에서 import해도 안전하다.

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
- `limitMaxLength`, `truncateMiddle`은 원문을 자를 때 서로게이트 쌍(이모지 등)을 반으로 자르지 않는다. 결과 길이는 지정한 값 이하다. 다만 `truncateMiddle`의 `omission`이 지정한 길이 이상이면 생략 표시 자체를 UTF-16 코드 유닛 기준으로 자르므로 쌍이 잘릴 수 있다. 이 경우 ASCII 생략 표시(`...` 등)를 쓴다.
- `pascalCase`, `kebabToPascal`은 각 단어를 소문자로 만든 뒤 첫 글자만 대문자로 한다. 약어도 단어 하나로 취급해서 `API`는 `Api`가 된다. `camelCase`는 첫 단어 전체를 소문자로 만들고 나머지 단어에 같은 규칙을 적용한다. 로캘은 따르지 않는다.
- `isNumericString`은 부호와 소수점만 허용하는 10진수 표기만 `true`다. 빈 문자열, 공백, 지수(`1e3`), 16진수, `Infinity`는 `false`다. `isDigitString`은 ASCII 숫자만 `true`다. 둘 다 타입 가드가 아니다.

### 값 비교

```ts
import { isDeepEqual, isShallowEqual } from "@cp949/utilx";

isShallowEqual({ a: 1 }, { a: 1 }); // true
isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }); // true
isDeepEqual(new Date(1), new Date(2)); // false
```

- 값은 `Object.is`로 비교한다. `NaN`끼리는 같고 `+0`과 `-0`은 다르다.
- 배열, 평범한 객체는 요소와 키를 비교한다. `isDeepEqual`은 `Date`(시각), `RegExp`, `Map`(값은 깊게), `Set`(요소는 `SameValueZero`)도 비교하고 순환 참조를 처리한다. 순환 길이가 달라도 펼친 값이 같으면 같다고 본다.
- 확신할 수 없으면 다르다고 판정한다. 같은 참조가 아닌 클래스 인스턴스, 함수, TypedArray는 다르다.
- 심볼 키와 프로토타입에서 상속한 키는 비교하지 않는다.

### 경로

```ts
import { joinPath, normalizePath, parsePath } from "@cp949/utilx";

normalizePath("/a//b/../c/./"); // '/a/c/'
joinPath("/a", "b", "../c"); // '/a/c'
parsePath("/home/user/file.tar.gz").ext; // '.gz'
```

- `/`로 구분하는 POSIX 경로 문자열만 다룬다. 파일 시스템에 접근하지 않는다. URL에는 쓰지 않는다(`http://`의 `//`가 합쳐진다). URL 조각은 `joinUrl`로 잇는다.
- Node의 `path.posix`와 같은 결과를 낸다. 길이 6 이하의 `a . /` 조합 1,093개를 `node:path`와 비교하는 테스트가 있다. 예외는 절대 경로 `/..`의 `parsePath`다. Node는 `ext`를 `'.'`으로 돌려주지만 여기서는 `'..'`와 같게 `''`이다.

### 숫자

```ts
import { parseIntegerOrUndefined, parseNumberOrUndefined } from "@cp949/utilx";

parseNumberOrUndefined(" 12.5 "); // 12.5
parseNumberOrUndefined(""); // undefined (Number('')는 0)
parseIntegerOrUndefined("42", { min: 1, max: 100 }); // 42
parseIntegerOrUndefined("1.5"); // undefined
```

- 허용하는 표기는 `isNumericString`과 같은 10진수다. 지수(`1e3`), 16진수(`0x10`), `Infinity`, `NaN`, 천 단위 구분자(`1,234`), 전각 숫자는 `undefined`다. `parseInt`처럼 뒤쪽의 숫자가 아닌 문자를 무시하지 않는다(`'12abc'`는 `undefined`).
- 앞뒤 공백은 무시한다. 빈 문자열과 공백뿐인 문자열은 `undefined`다. `-0`은 `0`으로 돌려준다.
- `parseIntegerOrUndefined`의 정수 판정은 문자열이 아니라 변환된 수 값 기준이다. `'1.0'`은 `1`이다. 소수부가 반올림으로 사라지는 `'1.0000000000000001'`도 `1`이 된다. 문자열 기준으로 소수를 거르려면 `isDigitString`을 먼저 쓴다.
- `parseIntegerOrUndefined`는 `Number.isSafeInteger`를 벗어나는 값(`'9007199254740993'`)을 `undefined`로 돌려준다. `min`, `max`가 유한한 수가 아니거나 `min > max`이면 `RangeError`다.

### nil 판별

```ts
import { isNil, isNotNil } from "@cp949/utilx";

isNil(0); // false
isNil(undefined); // true
const names: string[] = ["a", null, "b"].filter(isNotNil);
```

- nil은 `null`과 `undefined`다. `0`, `''`, `false`, `NaN`은 nil이 아니다.
- 둘 다 타입 가드다. `isNotNil`은 `NonNullable<T>`로 좁힌다.

### 배열

```ts
import { appendUnique, moveItem, removeFirst, uniq } from "@cp949/utilx";

// 새 배열을 돌려준다. 원본은 바꾸지 않는다.
appendUnique([1, 2], [2, 3], { inplace: false }); // [1, 2, 3]
moveItem(["a", "b", "c"], 0, 2, { inplace: false }); // ['b', 'c', 'a']
uniq([1, 2, 2, 3], { inplace: false }); // [1, 2, 3]

// 전달한 배열을 직접 수정하고 같은 배열을 돌려준다.
const checked = ["a", "b"];
removeFirst(checked, "a", { inplace: true }); // checked는 ['b']
```

- 배열을 바꾸는 함수는 마지막 인자로 `{ inplace: true }` 또는 `{ inplace: false }`를 반드시 받는다. 기본값은 없다. 호출부에서 원본이 바뀌는지 바로 보이게 하려는 것이다. 읽기만 하는 `lengthOf`, `isEmpty`, `isNotEmpty`, `firstItem`, `firstItems`, `lastItem`, `lastItems`, `isValidIndexRange`, `zipMap`은 받지 않는다.
- `inplace: true`는 `readonly` 배열을 받지 않는다. `inplace`가 `boolean` 변수이면 컴파일되지 않는다. `true`나 `false` 리터럴만 쓴다.
- 값 비교는 `SameValueZero`다(`Array.prototype.includes`와 같다). `NaN`은 `NaN`과 같다.
- 이름이 `Unique`나 `uniq`인 함수는 중복을 건너뛴다. 처음 나온 항목을 남기고 순서를 유지한다.
- `appendUnique`, `prependUnique`는 배열에 없는 값만 끝 또는 앞에 추가한다. `items` 안의 중복도 한 번만 추가하고, 원래 배열의 중복은 손대지 않는다. `prependUnique`는 `items`의 순서를 유지한다.
- `removeFirst`는 값이 같은 첫 항목만 뺀다.
- `updateFirst`는 조건에 맞는 첫 항목을 바꾼다. 맞는 항목이 없으면 `undefined`다.
- `moveItem`의 `fromIndex`가 음수이면 뒤에서부터 센다. 범위 밖이거나 정수가 아니면 옮기지 않는다. `toIndex`는 항목을 뺀 뒤의 배열에 끼워 넣는 위치이고, 범위를 넘으면 양 끝으로 맞춘다.
- `swapItems`는 두 위치의 항목을 바꾼다. 음수 인덱스는 뒤에서부터 센다. 하나라도 범위 밖이거나 정수가 아니면 바꾸지 않는다.
- `swapValues`는 두 값의 첫 위치를 바꾼다. 둘 중 하나라도 배열에 없으면 `undefined`다.
- `rotateLeft`, `rotateRight`는 `count`칸 돌린다. `count`가 길이 이상이면 나머지만큼 돌리고, 음수이면 반대 방향이다. 정수가 아니면 `RangeError`다.
- `uniqBy`의 `keyOf`는 항목에서 키를 꺼내는 함수이거나 항목의 속성 이름이다. 키가 같은 항목 중 처음 나온 것만 남긴다.
- `limitItems`는 항목이 `maxCount`개를 넘으면 뒤쪽을 버린다. `maxCount`가 0 이상의 정수가 아니면 `RangeError`다.
- `lengthOf`는 길이를 돌려주고 `null`, `undefined`는 `0`이다. 배열뿐 아니라 `length`가 있는 값이면 쓸 수 있다.
- `isEmpty`는 비어 있으면 `true`이고 `null`, `undefined`도 비어 있는 것으로 본다. `isNotEmpty`는 항목이 하나 이상일 때만 `true`다. 둘 다 `length`가 있는 값이면 쓸 수 있고 타입을 좁히지 않는다. 배열을 `[T, ...T[]]`로 좁히려면 `isNonEmptyArray`를 쓴다.
- `firstItem`은 첫 항목이다. 빈 배열이면 `undefined`다.
- `firstItems(arr, count)`는 앞에서부터 `count`개를 새 배열로 돌려준다. 규칙은 `lastItems`와 같다.
- `lastItem`은 마지막 항목이다. 빈 배열이면 `undefined`다.
- `lastItems(arr, count)`는 뒤에서부터 `count`개를 새 배열로 돌려준다. `count`가 길이보다 크면 모든 항목이고 `0`이면 빈 배열이다. 0 이상의 정수가 아니면 `RangeError`다.
- `isValidIndexRange(arr, startIndex, endIndex)`는 두 인덱스가 정수이고 `0 <= startIndex < endIndex <= 길이`이면 `true`다. 빈 구간(`startIndex === endIndex`)은 유효하지 않다.
- `zipMap(arrays, mapper)`는 여러 배열의 같은 위치 항목을 튜플 하나로 묶어 `mapper`에 넘기고 결과를 모은 배열을 만든다. 길이는 가장 긴 배열을 따르고 짧은 배열의 빈 자리는 `undefined`다.

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

```ts
import { invariant } from "@cp949/utilx";

const stack = [{ key: "settings", open: true }];
const entry = stack.find((e) => e.key === "settings");
invariant(entry, "dialog not found");
entry.open; // entry는 undefined가 아니다
```

- `invariant(condition, message)`는 프로그램이 참이라고 가정하는 상태를 확인하는 단언이다. 거짓이면 `name`이 `'Invariant Violation'`인 `Error`를 던진다. 메시지는 필수다. 사용자 입력 검증에는 쓰지 않는다.

### 오류 값

```ts
import { extractErrorMessage, toError } from "@cp949/utilx";

const failure = { message: "저장 실패", code: 500 };
extractErrorMessage(failure); // '저장 실패'
const error = toError(failure);
error.message; // '저장 실패'
error.cause === failure; // true
```

- 둘 다 예외를 던지지 않는다.
- `extractErrorMessage(err, fallback = 'unknown')`는 `null`/`undefined`이면 `fallback`, 문자열이면 그대로, 문자열 `message` 속성이 있는 객체(`Error`가 아니어도)이면 그 값, 그 외에는 `String(err)`다. `message` getter나 `String()` 변환이 예외를 던지면 `fallback`이다.
- `toError`는 `isError`가 `true`이면 그대로 돌려준다. 다른 realm(iframe)의 `Error`도 보존한다. 그 외에는 새 `Error`를 만들고 원래 값을 열거되지 않는 `cause` 속성에 담는다. 메시지는 `null`/`undefined`이면 `'unknown'`, 문자열 `message`가 있으면 그 값, 객체이면 `JSON.stringify` 결과, 나머지는 `String(err)`다. 모두 실패하면 `'unknown'`이다.
- 소스의 `lib`이 ES2019라서 `cause`는 `Error.cause` 생성자 옵션이 아니라 속성 대입으로 넣는다. 반환 타입은 `Error & { cause?: unknown }`다.
- 사용자에게 보여 주는 다국어 메시지를 만드는 함수가 아니다. 로그와 대체 메시지용이다.

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

- 기본 `base`는 `1024`다. `fractionDigits`를 생략하면 첫 단위는 정수, 그 위 단위는 10 미만이면 소수 첫째 자리까지 표기한다. `.0`은 생략한다. 단위를 고정하지 않은 음수는 반올림하지 않고 바이트 단위로 그대로 표기한다.
- 반올림 결과가 `base`에 닿으면 다음 단위로 올린다.
- `NaN`, `Infinity`는 `RangeError`다.

```ts
import {
  byteCountInUnit,
  formatByteCount,
  formatByteCountToParts,
} from "@cp949/utilx";

formatByteCount(1234567, { fractionDigits: 2 }); // '1.18 MB'
formatByteCount(1536, { fractionDigits: { min: 2, max: 2 } }); // '1.50 KB'
formatByteCount(3 * 1024 ** 3, { unit: "MB" }); // '3072 MB'
formatByteCountToParts(1536); // { value: 1.5, unit: 'KB' }
byteCountInUnit(1536 * 1024 ** 2, "GB", { fractionDigits: 1 }); // 1.5
```

- `fractionDigits`는 수이면 최대 자릿수(끝의 `0`은 지움), `{ min, max }`이면 최소 `min`자리까지 `0`으로 채운다. 각 자릿수는 0 이상 20 이하의 정수이며 `min <= max`여야 한다. 첫 단위(바이트)는 정수로 표기한다. 단위를 고정하지 않은 음수에는 소수 자릿수를 적용하지 않는다.
- `unit`은 `units` 안의 라벨 하나로 단위를 고정한다. 반올림 결과가 `base`에 닿아도 올리지 않는다. 없는 라벨이면 `RangeError`다.
- `formatByteCountToParts`는 같은 규칙으로 계산한 수(`number`)와 단위를 나눠 돌려준다. 수를 따로 `toLocaleString`으로 포매팅할 때 쓴다. `formatByteCount`는 천 단위 구분자를 넣지 않는다.
- `byteCountInUnit(size, unit, options?)`는 지정한 단위로 환산한 수를 `Math.round`로 `fractionDigits`(기본 `0`)자리까지 반올림해 돌려준다. 합산 같은 계산용이다. 표시용 문자열을 다시 수로 파싱하지 않는다.

### URL

```ts
import { joinUrl } from "@cp949/utilx";

joinUrl("https://example.com/", "/api/", "/v1"); // 'https://example.com/api/v1'
joinUrl("/", "a"); // '/a'
joinUrl("http:", "example.com", "foo", "?a=1", "&b=2", "#top");
// 'http://example.com/foo?a=1&b=2#top'
```

- 빈 문자열 조각은 건너뛴다. 조각이 없거나 모두 비어 있으면 `''`다. 문자열이 아닌 조각(`null`, `undefined` 포함)은 `TypeError`다.
- 조각 사이의 중복 `/`는 하나로 합친다. 첫 조각의 선행 `/`와 마지막 조각의 끝 `/`는 하나로 유지한다.
- 첫 조각이 `http:` 같은 프로토콜뿐이면 다음 조각과 합치고 `//`로 맞춘다(`file:`은 `///` 유지). 프로토콜 상대 URL(`//cdn.example.com`)과 IPv6 호스트(`[::1]`)는 그대로 둔다.
- `?`, `&`, `#`로 시작하는 조각은 `/` 없이 붙인다. 쿼리 조각은 `?a=1&b=2`로 합친다. `&`는 위치와 상관없이 쿼리 구분자로 보므로 경로에 `&`가 있으면 쓰지 않는다. `#` 뒤(해시)는 해석하지 않고, 비어 있으면 버린다.
- 인코딩하지 않는다. 이미 인코딩된 `%2F` 등은 건드리지 않는다.

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
scope.use(
  addEventListenerWithCleanup(window, "resize", () => console.log("크기 변경")),
); // 리스너 해제 등록
scope.setTimeout(() => console.log("1초 뒤"), 1000); // 타이머 취소 등록
scope.use(() => console.log("정리 완료")); // 임의의 cleanup
const request = fetch("data:text/plain,hello", { signal: scope.signal }).catch(
  (err: unknown) => {
    console.log(err); // dispose로 취소된 요청의 거부 처리
  },
);

scope.dispose(); // 등록의 역순으로 정리
await request;
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

const controller = new AbortController();
await sleep(500);
await sleep(5000, controller.signal); // abort되면 AbortError로 거부
await nextAnimationFrame(); // 다음 requestAnimationFrame까지
```

- `nextAnimationFrame`은 `requestAnimationFrame`이 없으면 `setTimeout(0)` 뒤에 완료한다. 브라우저는 숨겨진 탭에서 프레임을 멈추므로, 그동안은 완료되지 않는다.

### 다운로드·blob·클립보드

```ts
import {
  blobToFile,
  copyTextToClipboard,
  downloadBlob,
  downloadText,
  downloadUrl,
  ObjectUrlRegistry,
} from "@cp949/utilx";

downloadUrl("/reports/2026.pdf", "report.pdf");
downloadBlob(new Blob(["hello"], { type: "text/plain" }), "hello.txt");
downloadText("a,b\n1,2", "data.csv", { mimeType: "text/csv;charset=utf-8" });

const blob = new Blob(["hello"], { type: "text/plain" });
const file = blobToFile(blob, "hello.txt"); // Blob -> File
const copied = await copyTextToClipboard("복사할 텍스트"); // 성공하면 true

const registry = new ObjectUrlRegistry();
const url = registry.acquire(file); // 같은 Blob이면 같은 URL, 참조 횟수 +1
registry.release(file); // 0이 되면 revoke
registry.revokeAll(); // 모두 해제, 계속 사용 가능
registry.close(); // 모두 해제하고 닫음, 되돌릴 수 없음
```

- `downloadUrl`, `downloadBlob`, `downloadText`는 모두 `<a download>` 방식이다. `download` 속성이 없는 환경에서는 동작하지 않는다. 사용자 제스처 안에서 호출해야 한다.
- `downloadUrl`은 같은 출처의 URL, `blob:`, `data:` URL에서 동작한다. 다른 출처의 URL은 브라우저가 `download` 속성을 무시해 내려받지 않고 그 주소로 이동할 수 있다. 이때는 서버가 `Content-Disposition: attachment`를 보내야 한다.
- `downloadBlob`, `downloadText`가 만든 object URL은 40초 뒤에 해제한다.
- `blobToFile(blob, fileName, { type }?)`의 타입은 `options.type`, `blob.type`, `'application/octet-stream'` 순으로 비어 있지 않은 첫 값이다. `File`을 넘겨도 새 `File`을 만든다. 파일 이름을 바꾸는 데 쓸 수 있다.
- `copyTextToClipboard`는 성공하면 `true`, 쓸 수 없거나 거부되면 `false`이고 예외를 던지지 않는다. `navigator`나 `navigator.clipboard.writeText`가 없는 환경, `writeText`의 동기 예외와 거부가 모두 `false`다. `execCommand('copy')` 폴백은 없다. `navigator.clipboard`는 보안 컨텍스트(`https://`, `localhost`)에서만 노출되고, 쓰기 허용 조건은 브라우저마다 다르다. 사용자 제스처 안에서 호출하는 것이 안전하다.
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
- `hasGetUserMedia()`는 `navigator.mediaDevices.getUserMedia`가 함수일 때만 `true`다. `navigator`나 `mediaDevices`가 없는 환경에서는 `false`다. 권한 승인이나 장치 유무는 확인하지 않는다.

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

| @ocodelib/util                                                                                   | @cp949/utilx                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trim`, `isBlank`, `isNotBlank`, `strlen`                                                        | `trim`, `isBlank`, `isNotBlank`. `strlen`은 `str.length`를 쓴다. `isBlank`는 타입 가드가 아니다                                                                                                           |
| `trimToUndef`                                                                                    | `trimToUndefined`                                                                                                                                                                                         |
| `isNil`, `isNullish`, `isNotNil`                                                                 | `isNil`, `isNotNil`                                                                                                                                                                                       |
| `array`의 `append(arr, items, uniq)`                                                             | `appendUnique(arr, items, { inplace })`. `uniq` 인자는 없고 항상 중복을 건너뛴다. 중복을 허용하는 추가는 `[...a, ...b]`를 쓴다. 키 함수로 중복을 판단하는 `uniq` 옵션은 없다                              |
| `array`의 `prepend(arr, items, uniq)`, `$prepend`                                                | `prependUnique(arr, items, { inplace })`. `appendUnique`와 같은 규칙이다                                                                                                                                  |
| `array`의 `remove(arr, value)`, `$remove`                                                        | `removeFirst(arr, value, { inplace })`. `$` 접두어 대신 `inplace` 옵션으로 구분한다. 함수 조건은 받지 않는다                                                                                              |
| `array`의 `replace`, `$replace`                                                                  | `updateFirst(arr, match, update, { inplace })`. 맞는 항목이 없으면 `null` 대신 `undefined`                                                                                                                |
| `array`의 `move`, `$move`                                                                        | `moveItem(arr, fromIndex, toIndex, { inplace })`                                                                                                                                                          |
| `array`의 `swap`, `$swap`                                                                        | `swapItems(arr, indexA, indexB, { inplace })`. 범위 밖 인덱스는 빈 칸을 만들지 않고 바꾸지 않는다. 음수 인덱스를 지원한다                                                                                 |
| `array`의 `swapValue`, `$swapValue`                                                              | `swapValues(arr, valueA, valueB, { inplace })`. 없으면 `null` 대신 `undefined`. 값 비교는 `SameValueZero`다                                                                                               |
| `shiftRotateLeft`, `shiftRotateRight`, `$` 판                                                    | `rotateLeft`, `rotateRight(arr, count, { inplace })`. `count`는 필수이고 길이로 나눈 나머지만큼 돌린다. 빈 배열에 `undefined`를 끼워 넣던 동작은 없어졌다                                                 |
| `array`의 `uniq`, `$uniq`                                                                        | `uniq(arr, { inplace })`                                                                                                                                                                                  |
| `array`의 `uniqBy`, `$uniqBy`                                                                    | `uniqBy(arr, keyOf, { inplace })`. `keyOf`는 함수 또는 속성 이름이다                                                                                                                                      |
| `array`의 `size`                                                                                 | `lengthOf(value)`. `null`, `undefined`는 `0`이다                                                                                                                                                          |
| `array`의 `truncate`, `$truncate`                                                                | `limitItems(arr, maxCount, { inplace })`. `maxCount`가 0 이상의 정수가 아니면 `RangeError`다                                                                                                              |
| `array`의 `last(arr, n)`                                                                         | `lastItems(arr, count)`. `count`가 `0`이면 빈 배열이다(기존에는 전체를 돌려줬다). 0 이상의 정수가 아니면 `RangeError`다                                                                                   |
| `array`의 `lastOne`                                                                              | `lastItem(arr)`                                                                                                                                                                                           |
| `array`의 `isEmpty`, `isNotEmpty`                                                                | 같은 이름. `null`, `undefined` 처리도 같다                                                                                                                                                                |
| `array`의 `firstOne`                                                                             | `firstItem(arr)`                                                                                                                                                                                          |
| `array`의 `first(arr, n)`                                                                        | `firstItems(arr, count)`. `count`는 필수이고 0 이상의 정수가 아니면 `RangeError`다                                                                                                                        |
| `array`의 `isValidRange`                                                                         | `isValidIndexRange(arr, startIndex, endIndex)`. 기존 함수는 구간이 유효하지 않을 때 `true`를 돌려줬다. 반대로 유효할 때 `true`다                                                                          |
| `array`의 `zipWith(arrays, iteratee)`                                                            | `zipMap(arrays, mapper)`. lodash의 `zipWith`와 인자 형태가 달라 이름을 바꿨다. `mapper`는 항목을 여러 인자가 아니라 튜플 하나로 받는다. 짧은 배열의 빈 자리는 `undefined`이고 튜플 원소 타입에도 반영된다 |
| `formatByteCount`                                                                                | `formatByteCount`. `NaN`/`Infinity`는 `RangeError`, 옵션 `base`/`units` 추가                                                                                                                              |
| `fileExtension(name, lowerCase, withDot)`                                                        | `fileExtension(name, { lowerCase, withDot })`. 점으로 시작하는 이름(`.bashrc`)은 `null`                                                                                                                   |
| `fileNamePart`                                                                                   | `fileBaseName`                                                                                                                                                                                            |
| `downloadBlob`                                                                                   | `downloadBlob`. iOS의 `window.open` 대체 경로는 제거했다. object URL은 40초 뒤에 해제한다                                                                                                                 |
| `uint8-array`의 `isUint8Array`, `toUint8Array`                                                   | 같은 이름. `toUint8Array`는 `ArrayBuffer`와 모든 `ArrayBufferView`를 받는다                                                                                                                               |
| `concatUint8Arrays(arrays, totalLength)`                                                         | `concatUint8Arrays(arrays)`. `totalLength` 인자는 제거했다                                                                                                                                                |
| `areUint8ArraysEqual`, `compareUint8Arrays`                                                      | 같은 이름                                                                                                                                                                                                 |
| `indexOf`, `includes` (uint8-array)                                                              | `indexOfUint8Array`, `includesUint8Array`. 빈 검색 대상은 `-1` 대신 `0`                                                                                                                                   |
| `uint8ArrayToString`, `stringToUint8Array`                                                       | 같은 이름. 기본 인코딩은 `"utf-8"`                                                                                                                                                                        |
| `uint8ArrayToBase64`, `base64ToUint8Array`, `stringToBase64`, `base64ToString`                   | 같은 이름                                                                                                                                                                                                 |
| `uint8ArrayToHex`, `hexToUint8Array`                                                             | 같은 이름. 잘못된 입력은 `Error` 대신 `RangeError`                                                                                                                                                        |
| `assertUint8Array`, `getUintBE`                                                                  | 제거. 런타임 검사 대신 TypeScript 타입을 쓰고, `getUintBE`는 `DataView`로 직접 읽는다                                                                                                                     |
| `pusermedia`의 `closeUserMedia`, `closeUserMediaAudioTracks`, `closeUserMediaVideoTracks`        | `stopMediaStream(stream, kind?)` 하나로 합쳤다                                                                                                                                                            |
| `hasGetUserMedia`                                                                                | 같은 이름. 서버에서도 안전하다                                                                                                                                                                            |
| `fixUserMedia`                                                                                   | 제거. import만으로 `window`/`navigator`를 바꾸는 오래된 브라우저용 폴리필이다                                                                                                                             |
| `types`의 `isString`, `isNumber`, `isBoolean`, `isPlainObject`, `isNonEmptyArray`, `isError`     | 같은 이름. `isPlainObject`는 타입 가드로 바꿨고 `isNonEmptyArray`는 `unknown` 대신 배열을 받는다                                                                                                          |
| `types`의 `isFunction`                                                                           | 같은 이름. 기존 구현은 `async` 함수를 `false`로 판정했다                                                                                                                                                  |
| `types`의 `isPromise`                                                                            | `isPromiseLike`                                                                                                                                                                                           |
| `types`의 `createTypeGuard`, `createTypeAssertion`, `isUnion`                                    | 제거                                                                                                                                                                                                      |
| `types`의 나머지 가드(`isEmail`, `isJSON`, `isBuffer`, `isElement`, Web API, 제너레이터 계열 등) | 제거. `instanceof`/`typeof`로 충분하거나 용도가 좁다                                                                                                                                                      |

## 개발

Node.js 24 이상과 pnpm이 필요하다. 저장소 루트에서 실행한다.

```sh
pnpm install
pnpm verify
```

`pnpm verify`는 다음을 순서대로 실행한다.

| 명령                  | 검사                                                                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`           | ESLint. `src/**`의 Node 전역, `Math.random`, 외부 import 금지. DOM 전역은 `src/web`에서만 허용. `globalThis`·`window`·`self` 경유 접근과 `globalThis` 값 전달도 금지 |
| `pnpm format:check`   | prettier                                                                                                                                                             |
| `pnpm build`          | `dist`를 지우고 `tsc`로 빌드                                                                                                                                         |
| `pnpm check:escompat` | `dist`가 `baseline.json`의 Chrome 하한(75)과 ES2019 기준을 만족하는지. `dist/web` 밖의 DOM 전역과 전역 객체 경유 접근도 검사                                         |
| `pnpm check:deps`     | 소스와 tarball의 런타임 의존성이 0인지                                                                                                                               |
| `pnpm test:gates`     | 위 두 게이트와 `baseline.json` 검증의 허용·금지 fixture 검사. 게이트가 위반을 실제로 잡는지 확인                                                                     |
| `pnpm check-types`    | 소스와 테스트의 타입 검사                                                                                                                                            |
| `pnpm test`           | 단위 테스트                                                                                                                                                          |

### 소스 파일 규칙

- 공개 함수와 클래스는 파일 하나에 하나씩 두고, 파일명은 이름과 같다(`trim.ts`, `ObjectUrlRegistry.ts`).
- 공개 심볼 하나만 쓰는 타입과 helper는 그 파일에 둔다. 둘 이상이 쓰는 공개 타입은 타입 이름으로 파일을 만든다(`ArrayInPlaceOptions.ts`).
- 여러 공개 파일이 쓰는 내부 helper 파일에는 `.internal.ts` suffix를 붙인다. 디렉터리의 `index.ts`에서 re-export하지 않는다.
- 디렉터리의 `index.ts`는 공개 파일을 `export *`로 모은다.

### tree-shaking 지침

사용하지 않는 export가 번들에서 빠지도록 다음을 지킨다. 자동 검사는 없고 리뷰에서 확인한다.

- 모듈 최상위에서 실행되는 코드를 두지 않는다. 상수와 함수, 클래스 선언만 둔다. 모듈 최상위의 `new`, 전역 변경, 정적 초기화 블록(`static {}`)은 금지한다.
- 이름 있는 export만 쓴다. 기본 export와 객체로 묶은 export는 만들지 않는다.
- `package.json`의 `"sideEffects": false`를 유지한다.
- 새 export를 추가하면 그것만 import한 번들에 다른 코드가 딸려 오지 않는지 확인한다.

Chrome 하한은 `baseline.json` 한 곳에서만 선언한다. 실제 브라우저 실행 검증은 하지 않는다. `check:escompat`은 정적 검사다.
