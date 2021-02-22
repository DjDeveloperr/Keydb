import { ModuleCache } from "https://deno.land/x/module_cache@0.0.1/mod.ts";

export interface KeydbFields {
  key: string;
  value: string;
  ns: string;
  ttl: number;
}

export interface Adapter {
  awaitReady?: Promise<Adapter>;
  set(
    key: string,
    // deno-lint-ignore no-explicit-any
    value: any,
    namespace: string,
    ttl: number
  ): this | Promise<this>;
  get(
    key: string,
    namespace: string
  ): KeydbFields | undefined | Promise<KeydbFields | undefined>;
  delete(key: string, namespace: string): boolean | Promise<boolean>;
  has(key: string, namespace: string): boolean | Promise<boolean>;
  clear(namespace: string): this | Promise<this>;
  keys(namespace: string): string[] | Promise<string[]>;
  deleteExpired(namespace: string): void | Promise<void>;
}

export interface AdapterInitializer {
  protocol: string;
  init: (uri: URL) => Adapter | Promise<Adapter>;
}

const cache = new ModuleCache("keydb");
// deno-lint-ignore no-namespace
export namespace Adapters {
  export function getAll(): AdapterInitializer[] {
    return cache.get("adapters") || [];
  }

  export function get(protocol: string): AdapterInitializer | undefined {
    return getAll().find(
      (e) => e.protocol.toLowerCase() == protocol.toLowerCase()
    );
  }

  export function register(adapter: AdapterInitializer): void {
    if (/^[A-Za-z0-9]+$/.test(adapter.protocol) === false)
      throw new Error("Bad Adapter protocol. Must have only A-Z, a-z and 0-9.");
    const adapters = getAll();
    if (
      adapters.find(
        (e) => e.protocol.toLowerCase() == adapter.protocol.toLowerCase()
      )
    )
      throw new Error("Adapter with this protocol already exists");
    adapters.push(adapter);
    cache.set("adapters", adapters);
  }
}
