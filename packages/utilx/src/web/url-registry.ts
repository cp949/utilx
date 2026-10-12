interface RegistryEntry {
  blob: Blob;
  url: string;
  refs: number;
}

/**
 * Blob과 연결된 object URL의 수명을 참조 횟수로 관리하는 레지스트리다.
 * 컴포넌트가 만든 미리보기 URL을 언마운트 때 한꺼번에 해제하는 용도에 쓴다.
 *
 * 가비지 컬렉션 때 자동으로 URL을 해제하지 않는다. 호출자가 `release()`, `revoke()`, `revokeAll()`,
 * `close()`로 수명을 관리해야 한다. 등록된 Blob은 해제하기 전까지 메모리에 남는다.
 *
 * `close()`는 되돌릴 수 없다. React 개발 모드(StrictMode)는 effect를 "실행, cleanup, 재실행" 순서로
 * 돌리므로, cleanup에서 `close()`를 부른 인스턴스를 재실행에서 다시 쓰면 `acquire()`가 예외를 던진다.
 * 인스턴스를 effect 안에서 만들거나, cleanup에서 `revokeAll()`만 부른다.
 *
 * @example
 * useEffect(() => {
 *   const registry = new URLCreateRegistry();
 *   const url = registry.acquire(file);
 *   setPreviewUrl(url);
 *   return () => registry.close();
 * }, [file]);
 */
export class URLCreateRegistry {
  private blobToEntry = new Map<Blob, RegistryEntry>();
  private urlToEntry = new Map<string, RegistryEntry>();
  private isClosed = false;

  /**
   * Blob의 object URL을 얻고 참조 횟수를 1 올린다. 같은 Blob이면 기존 URL을 재사용한다.
   *
   * @throws {Error} 닫힌 레지스트리일 때
   */
  acquire = (blob: Blob): string => {
    if (this.isClosed) {
      throw new Error("URLCreateRegistry는 이미 닫혔다");
    }

    const existing = this.blobToEntry.get(blob);
    if (existing) {
      existing.refs += 1;
      return existing.url;
    }

    const url = URL.createObjectURL(blob);
    const entry: RegistryEntry = { blob, url, refs: 1 };
    this.blobToEntry.set(blob, entry);
    this.urlToEntry.set(url, entry);
    return url;
  };

  /**
   * Blob 또는 URL의 참조 횟수를 1 내린다. 0이 되면 object URL을 해제한다.
   *
   * @returns 등록된 대상이었으면 `true`. 닫혔거나 등록되지 않았으면 `false`
   */
  release = (target: Blob | string): boolean => {
    if (this.isClosed) return false;

    const entry = this.findEntry(target);
    if (!entry) return false;

    if (entry.refs > 0) entry.refs -= 1;
    if (entry.refs <= 0) this.revokeEntry(entry);
    return true;
  };

  /**
   * Blob 또는 URL을 참조 횟수와 무관하게 즉시 해제한다.
   *
   * @returns 등록된 대상이었으면 `true`. 닫혔거나 등록되지 않았으면 `false`
   */
  revoke = (target: Blob | string): boolean => {
    if (this.isClosed) return false;

    const entry = this.findEntry(target);
    if (!entry) return false;

    this.revokeEntry(entry);
    return true;
  };

  /** 등록된 모든 object URL을 해제하고 해제한 개수를 돌려준다. 레지스트리는 계속 쓸 수 있다. */
  revokeAll = (): number => {
    const entries = [...this.blobToEntry.values()];
    for (const entry of entries) {
      this.revokeEntry(entry);
    }
    return entries.length;
  };

  /** Blob에 연결된 URL을 조회한다. */
  getURL = (blob: Blob): string | undefined => {
    return this.blobToEntry.get(blob)?.url;
  };

  /** URL에 연결된 Blob을 조회한다. */
  getBlob = (url: string): Blob | undefined => {
    return this.urlToEntry.get(url)?.blob;
  };

  /** Blob 또는 URL이 등록되어 있는지 확인한다. */
  has = (target: Blob | string): boolean => {
    return this.findEntry(target) !== undefined;
  };

  /** 등록된 항목 개수. */
  get size(): number {
    return this.blobToEntry.size;
  }

  /**
   * 남은 URL을 모두 해제하고 레지스트리를 닫는다. 닫은 뒤에는 `acquire()`가 예외를 던지고,
   * `release()`와 `revoke()`는 `false`를 돌려준다. 되돌릴 수 없다.
   */
  close = (): void => {
    this.revokeAll();
    this.isClosed = true;
  };

  private findEntry(target: Blob | string): RegistryEntry | undefined {
    return typeof target === "string"
      ? this.urlToEntry.get(target)
      : this.blobToEntry.get(target);
  }

  private revokeEntry(entry: RegistryEntry): void {
    if (!this.blobToEntry.has(entry.blob)) return;

    this.blobToEntry.delete(entry.blob);
    this.urlToEntry.delete(entry.url);
    URL.revokeObjectURL(entry.url);
  }
}
