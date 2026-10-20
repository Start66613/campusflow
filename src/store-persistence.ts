/** All reads, writes and backup restores share one ordered queue. A failed write
 * rejects its caller, but never blocks future recovery or later saves. */
export function createStorageQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(operation: () => Promise<T>): Promise<T> {
      const result = tail.then(operation);
      tail = result.catch(() => undefined);
      return result;
    },
  };
}
