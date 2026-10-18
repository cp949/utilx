interface ListNode<T> {
  value: T;
  next: ListNode<T> | undefined;
}

function assertMaxSize(maxSize: number): void {
  if (!Number.isInteger(maxSize) || maxSize <= 0) {
    throw new RangeError(`maxSize는 1 이상의 정수여야 한다: ${maxSize}`);
  }
}

/**
 * 최대 `maxSize`개만 보관하고, 넘치면 가장 오래된 항목을 버리는 FIFO 버퍼다.
 * 채팅 메시지나 로그를 최근 n개만 유지하는 용도에 쓴다.
 *
 * `push`, `shift`, `peek*`, `clear`는 O(1)이다. `setMaxSize`로 줄이면 제거하는 항목 수 k에 대해 O(k)이고,
 * `toArray`, `clone`, 반복은 O(n)이다.
 * 비어 있을 때 `shift`, `peekOldest`, `peekNewest`는 `undefined`를 돌려준다.
 * 값 자체가 `undefined`일 수 있다면 `size`로 구분한다.
 *
 * @example
 * const buffer = new BoundedBuffer<string>(2);
 * buffer.push('a');
 * buffer.push('b');
 * buffer.push('c');
 * buffer.toArray(); // ['b', 'c']
 */
export class BoundedBuffer<T> implements Iterable<T> {
  private head: ListNode<T> | undefined;
  private tail: ListNode<T> | undefined;
  private count = 0;
  private limit: number;

  /**
   * @param maxSize 보관할 최대 개수. 1 이상의 정수여야 한다
   * @throws {RangeError} `maxSize`가 1 이상의 정수가 아닐 때
   */
  constructor(maxSize: number) {
    assertMaxSize(maxSize);
    this.limit = maxSize;
  }

  /** 현재 보관 중인 개수. */
  get size(): number {
    return this.count;
  }

  /** 보관할 수 있는 최대 개수. */
  get maxSize(): number {
    return this.limit;
  }

  /** 새 항목을 뒤에 추가한다. 최대 개수를 넘으면 가장 오래된 항목을 버린다. */
  push(value: T): void {
    const node: ListNode<T> = { value, next: undefined };
    if (this.tail) {
      this.tail.next = node;
    } else {
      this.head = node;
    }
    this.tail = node;
    this.count += 1;

    if (this.count > this.limit) {
      this.shift();
    }
  }

  /** 가장 오래된 항목을 꺼낸다. 비어 있으면 `undefined`다. */
  shift(): T | undefined {
    const node = this.head;
    if (!node) return undefined;

    this.head = node.next;
    if (!this.head) this.tail = undefined;
    this.count -= 1;
    return node.value;
  }

  /** 가장 오래된 항목을 제거하지 않고 확인한다. 비어 있으면 `undefined`다. */
  peekOldest(): T | undefined {
    return this.head?.value;
  }

  /** 가장 최근 항목을 제거하지 않고 확인한다. 비어 있으면 `undefined`다. */
  peekNewest(): T | undefined {
    return this.tail?.value;
  }

  /** 모든 항목을 비운다. `maxSize`는 유지한다. */
  clear(): void {
    this.head = undefined;
    this.tail = undefined;
    this.count = 0;
  }

  /**
   * 최대 개수를 바꾼다. 줄이면 넘친 만큼 오래된 항목부터 버리며, 버리는 항목 수 k에 대해 O(k)이다.
   *
   * @throws {RangeError} `maxSize`가 1 이상의 정수가 아닐 때
   */
  setMaxSize(maxSize: number): void {
    assertMaxSize(maxSize);
    this.limit = maxSize;
    while (this.count > this.limit) {
      this.shift();
    }
  }

  /** 오래된 순서의 새 배열을 돌려준다. 호출마다 새 배열이라 React 상태에 그대로 넣을 수 있다. */
  toArray(): T[] {
    return [...this];
  }

  /** 같은 항목과 `maxSize`를 가진 독립 복사본을 만든다. */
  clone(): BoundedBuffer<T> {
    const copy = new BoundedBuffer<T>(this.limit);
    for (const value of this) {
      copy.push(value);
    }
    return copy;
  }

  /** 오래된 항목부터 순회한다. */
  *[Symbol.iterator](): Iterator<T> {
    let node = this.head;
    while (node) {
      yield node.value;
      node = node.next;
    }
  }
}
