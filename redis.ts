// Redis Adapter is untested and incomplete!
import {
  connect,
  Redis,
  RedisConnectOptions,
} from "https://deno.land/x/redis@v0.18.0/mod.ts";
import { Adapter, Adapters, KeydbFields } from "./adapter.ts";
import { Keydb } from "./keydb.ts";

export class RedisAdapter implements Adapter {
  db: Redis;
  table: string;

  constructor(client: Redis, table: string = "") {
    this.db = client;
    this.table = table;
  }

  /** Connect to a Postgres Database and create Adapter. */
  static async connect(dbOptions: RedisConnectOptions, table?: string) {
    const client = await connect(dbOptions);
    const res = new RedisAdapter(client, table);
    return res;
  }

  getPrefixedKey(key: string, ns = "") {
    return `${ns}:${key}`;
  }

  async get(key: string, namespace = ""): Promise<KeydbFields | undefined> {
    const res = await this.db.hgetall(this.getPrefixedKey(key, namespace));
    if (res.length === 0) return undefined;
    return {
      key: res[0],
      value: res[1],
      ns: res[2],
      ttl: Number(res[3]),
    };
  }

  async has(key: string, namespace = ""): Promise<boolean> {
    const res = await this.db.hget(this.getPrefixedKey(key, namespace), "key");
    return res !== undefined;
  }

  async set(
    key: string,
    // deno-lint-ignore no-explicit-any
    value: any,
    namespace = "",
    ttl = 0
  ): Promise<this> {
    key = this.getPrefixedKey(key, namespace);
    const fields: [string, string][] = [
      ["key", key],
      ["value", value],
      ["ns", namespace],
      ["ttl", ttl.toString()],
    ];

    await this.db.hset(key, ...fields);

    if (ttl !== 0)
      await this.db.expireat(
        this.getPrefixedKey(key, namespace),
        (ttl / 1000).toString()
      );
    return this;
  }

  async clear(namespace = ""): Promise<this> {
    const keys = await this.keys(namespace);
    if (keys.length !== 0) await this.db.del(...keys);
    return this;
  }

  async delete(key: string, namespace = ""): Promise<boolean> {
    const has = await this.has(key);
    if (!has) return false;
    await this.db.del(this.getPrefixedKey(key, namespace));
    return true;
  }

  async keys(namespace = ""): Promise<string[]> {
    return await this.db.keys(`${namespace}:*`);
  }

  async deleteExpired(_namespace = ""): Promise<void> {}
}

Adapters.register({
  protocol: "redis",
  init(uri) {
    return RedisAdapter.connect({
      hostname: uri.hostname,
      password: uri.searchParams.get("password") || undefined,
      port: uri.port,
      name: uri.username || undefined,
      db: uri.searchParams.get("db")
        ? Number(uri.searchParams.get("db"))
        : undefined,
      tls: uri.searchParams.get("tls") === "true",
      maxRetryCount: uri.searchParams.get("max_retry")
        ? Number(uri.searchParams.get("max_retry"))
        : undefined,
      retryInterval: uri.searchParams.get("retry_interval")
        ? Number(uri.searchParams.get("retry_interval"))
        : undefined,
    });
  },
});

export { Keydb };
