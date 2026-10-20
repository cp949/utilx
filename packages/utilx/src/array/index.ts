/**
 * 배열 유틸이다.
 *
 * 배열을 바꾸는 함수는 마지막 인자로 `{ inplace }`를 반드시 받는다. 기본값은 없다.
 * 배열을 읽기만 하는 함수(`lengthOf`, `firstItem`, `zipMap` 등)는 `{ inplace }`를 받지 않는다.
 * - `{ inplace: true }`: 전달한 배열을 직접 수정하고 같은 배열을 돌려준다. `readonly` 배열은 받지 않는다.
 * - `{ inplace: false }`: 원본은 그대로 두고 수정한 새 배열을 돌려준다.
 *
 * 값 비교는 `SameValueZero`다(`Array.prototype.includes`와 같다). `NaN`은 `NaN`과 같다.
 */

export * from "./ArrayCopyOptions.js";
export * from "./ArrayInPlaceOptions.js";
export * from "./appendUnique.js";
export * from "./limitItems.js";
export * from "./moveItem.js";
export * from "./prependUnique.js";
export * from "./removeFirst.js";
export * from "./rotateLeft.js";
export * from "./rotateRight.js";
export * from "./swapItems.js";
export * from "./swapValues.js";
export * from "./uniq.js";
export * from "./uniqBy.js";
export * from "./updateFirst.js";

/**
 * 배열을 읽기만 하는 유틸이다. 인자를 바꾸지 않으므로 `{ inplace }` 옵션을 받지 않는다.
 */
export * from "./firstItem.js";
export * from "./firstItems.js";
export * from "./isEmpty.js";
export * from "./isNotEmpty.js";
export * from "./isValidIndexRange.js";
export * from "./lastItem.js";
export * from "./lastItems.js";
export * from "./lengthOf.js";

/**
 * 여러 배열을 같은 위치끼리 묶어 새 배열로 만드는 유틸이다. 인자를 바꾸지 않는다.
 */
export * from "./zipMap.js";

/**
 * 배열을 같은 크기의 조각으로 나누는 유틸이다. 인자를 바꾸지 않는다.
 */
export * from "./chunk.js";
