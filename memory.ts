import { Adapter } from "./adapter.ts";

export class MemoryAdapter implements Adapter {
  namespaces: Map<
    string,
    Map<string, { value: string; ttl: number }>
  > = new Map();

  checkNamespace(ns: string) {
    if (this.namespaces.has(ns)) return;
    else this.namespaces.set(ns, new Map());
  }

  ns(ns: string) {
    this.checkNamespace(ns);
    return this.namespaces.get(ns);
  }

  // deno-lint-ignore no-explicit-any
  set(k: string, v: any, ns = "", ttl = 0) {
    const n = this.ns(ns);
    n?.set(k, { value: v, ttl });
    return this;
  }

  get(k: string, ns = "") {
    const n = this.ns(ns);
    const v = n?.get(k);
    return !v ? undefined : { key: k, ns, value: v.value, ttl: v.ttl };
  }

  has(k: string, ns = "") {
    return this.ns(ns)?.has(k) ?? false;
  }

  delete(k: string, ns = "") {
    const n = this.ns(ns);
    return n?.delete(k) ?? false;
  }

  keys(ns = "") {
    return [...(this.ns(ns)?.keys() ?? [])];
  }

  clear(ns = "") {
    this.namespaces.set(ns, new Map());
    return this;
  }

  deleteExpired(ns = "") {
    const n = this.ns(ns)!;
    for (const e of n.entries()) {
      if (e[1].ttl !== 0 && Date.now() > e[1].ttl) {
        n.delete(e[0]);
      }
    }
  }
}
