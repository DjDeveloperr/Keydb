import { Adapter, Adapters } from "./adapter.ts";
import { JSONB } from "./jsonb.ts";
import { MemoryAdapter } from "./memory.ts";

export interface KeydbOptions {
  namespace?: string;
  ttl?: number;
  // deno-lint-ignore no-explicit-any
  serialize?: (value: any) => string | undefined;
  // deno-lint-ignore no-explicit-any
  deserialize?: (value: string) => any;
}

function tryParseURL(q: string) {
  try {
    return new URL(q);
  } catch (e) {
    return;
  }
}

/** Simple and common Key-value storage interface for multiple Database backends. */
export class Keydb {
  adapter?: Adapter;
  awaitReady?: Promise<Adapter>;
  namespace = "";
  // deno-lint-ignore no-explicit-any
  serialize: (value: any) => string | undefined = JSONB.stringify;
  // deno-lint-ignore no-explicit-any
  deserialize: (value: string) => any = JSONB.parse;
  ttl?: number;

  constructor(
    adapter: Adapter | string = new MemoryAdapter(),
    options?: KeydbOptions
  ) {
    this.adapter = typeof adapter === "object" ? adapter : undefined;
    if (this.adapter === undefined && typeof adapter !== "object") {
      const proto = tryParseURL(adapter);
      if (!proto) throw new Error("Invalid Adapter Connection URI");
      const protocol = proto.protocol;
      const adp = Adapters.get(protocol.substr(0, protocol.length - 1));
      if (!adp) throw new Error(`Adapter not found for Protocol: ${protocol}`);
      const res = adp.init(proto);
      if (res instanceof Promise) {
        this.awaitReady = res.then((a) => {
          this.adapter = a;
          this.awaitReady = undefined;
          return a;
        });
      } else this.adapter = res;
    }
    this.namespace = options?.namespace ?? "";
    if (options?.serialize) this.serialize = options.serialize;
    if (options?.deserialize) this.deserialize = options.deserialize;
    if (options?.ttl) this.ttl = options.ttl;
  }

  /**
   * Get a Value by Key name.
   *
   * @param key Name of Key to get Value.
   */
  // deno-lint-ignore no-explicit-any
  async get<T = any>(key: string): Promise<T | undefined> {
    if (this.awaitReady) await this.awaitReady;
    await this.adapter?.deleteExpired(this.namespace);
    const val = await this.adapter?.get(key, this.namespace);
    if (val == undefined) return undefined;
    const res = this.deserialize(val.value);
    return res;
  }

  /**
   * Set a Key's Value.
   *
   * @param key Name of the Key to set.
   * @param value Value to set.
   */
  // deno-lint-ignore no-explicit-any
  async set(key: string, value: any, ttl?: number): Promise<this> {
    if (this.awaitReady) await this.awaitReady;
    const _ttl = ttl ?? this.ttl;
    value = {
      value,
      ttl: _ttl && typeof _ttl === "number" ? Date.now() + _ttl : undefined,
    };
    await this.adapter?.set(
      key,
      this.serialize(value.value),
      this.namespace,
      value.ttl
    );
    return this;
  }

  /**
   * Delete a Key from Database.
   *
   * @param key Name of the Key to delete.
   */
  async delete(key: string): Promise<boolean> {
    if (this.awaitReady) await this.awaitReady;
    return (await this.adapter?.delete(key, this.namespace)) ?? false;
  }

  /** Clear complete Database. */
  async clear(): Promise<this> {
    if (this.awaitReady) await this.awaitReady;
    await this.adapter?.clear(this.namespace);
    return this;
  }

  /** Get an Array of all Key Names. */
  async keys(): Promise<string[]> {
    if (this.awaitReady) await this.awaitReady;
    await this.adapter?.deleteExpired(this.namespace);
    const keys = (await this.adapter?.keys(this.namespace)) ?? [];
    return keys;
  }
}
