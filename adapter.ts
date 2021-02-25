import { ModuleCache } from "https://deno.land/x/module_cache@0.0.3/mod.ts";

export interface KeydbFields {
  key: string;
  value: string;
  ns: string;
  ttl: number;
}

/** Interface to be implemented by Adapter Implementations */
export interface Adapter {
  /** Promise used to await the adapter to be ready (in some cases connected to Database Server) */
  awaitReady?: Promise<Adapter>;
  /** Set a value by key name */
  set(
    key: string,
    // deno-lint-ignore no-explicit-any
    value: any,
    namespace: string,
    ttl: number
  ): this | Promise<this>;
  /** Get a value by key name */
  get(
    key: string,
    namespace: string
  ): KeydbFields | undefined | Promise<KeydbFields | undefined>;
  /** Delete a key */
  delete(key: string, namespace: string): boolean | Promise<boolean>;
  /** Check whether DB has a specific key */
  has(key: string, namespace: string): boolean | Promise<boolean>;
  /** Clear (delete) all keys. */
  clear(namespace: string): this | Promise<this>;
  /** Get all keys. */
  keys(namespace: string): string[] | Promise<string[]>;
  /** Delete all expired keys. Called before read-related operations. */
  deleteExpired(namespace: string): void | Promise<void>;
}

export interface AdapterInitializer {
  /** Protocol name. For example `sqlite` for `sqlite://path/to/file` */
  protocol: string;
  /** Initializer method */
  init: (uri: URL) => Adapter | Promise<Adapter>;
}

const cache = new ModuleCache("keydb");
/** Namespace to manage Adapters Protocol Registry (for URI-based initialization) */
// deno-lint-ignore no-namespace
export namespace Adapters {
  /** Get all registered Adapter protocols */
  export function getAll(): AdapterInitializer[] {
    return cache.get("adapters") || [];
  }

  /** Get an Adapter protocol by name */
  export function get(protocol: string): AdapterInitializer | undefined {
    return getAll().find(
      (e) => e.protocol.toLowerCase() == protocol.toLowerCase()
    );
  }

  /** Register a new Adapter Protocol */
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
