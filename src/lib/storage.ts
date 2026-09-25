/** Safe wrappers around Web Storage — storage can throw (private mode, blocked cookies). */
function read<T>(store: Storage, key: string): T | null {
  try {
    const raw = store.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(store: Storage, key: string, value: unknown) {
  try {
    if (value === null || value === undefined) store.removeItem(key)
    else store.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export const local = {
  get: <T>(key: string) => read<T>(localStorage, key),
  set: (key: string, value: unknown) => write(localStorage, key, value),
}

export const session = {
  get: <T>(key: string) => read<T>(sessionStorage, key),
  set: (key: string, value: unknown) => write(sessionStorage, key, value),
}
