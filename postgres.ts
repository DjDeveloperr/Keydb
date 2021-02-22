import { Client } from "https://deno.land/x/postgres@v0.7.1/mod.ts";
import { ConnectionOptions } from "https://deno.land/x/postgres@v0.7.1/connection_params.ts";
import { Adapter, Adapters, KeydbFields } from "./adapter.ts";
import { Keydb } from "./keydb.ts";

export class PostgresAdapter implements Adapter {
  db: Client;
  table: string;

  constructor(client: Client, table: string = "keydb") {
    this.db = client;
    this.table = table;
  }

  /** Connect to a Postgres Database and create Adapter. */
  static async connect(dbOptions?: ConnectionOptions | string, table?: string) {
    const client = new Client(dbOptions);
    await client.connect();
    const res = new PostgresAdapter(client, table);
    const exists = res
      .query(`SELECT key FROM ${res.table} LIMIT 1`)
      .then(() => true)
      .catch(() => false);
    if (!exists)
      await res.query(
        `CREATE TABLE IF NOT EXISTS ${res.table} (key VARCHAR(255) PRIMARY KEY, value TEXT, ns VARCHAR(255), ttl BIGINT)`
      );
    return res;
  }

  // deno-lint-ignore no-explicit-any
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const res = await this.db.queryObject(sql, ...params);
    return [...res.rows] as T[];
  }

  async get(key: string, namespace = ""): Promise<KeydbFields | undefined> {
    return await this.query<{
      key: string;
      value: string;
      ns: string;
      ttl: number;
    }>(`SELECT * FROM ${this.table} WHERE key = $1 AND ns = $2`, [
      key,
      namespace,
    ]).then((r) => (r.length == 0 ? undefined : r[0]));
  }

  async has(key: string, namespace = ""): Promise<boolean> {
    const res = await this.query<{ key: string }>(
      `SELECT key FROM ${this.table} WHERE key = $1 AND ns = $2`,
      [key, namespace]
    );
    return res.length > 0;
  }

  async set(
    key: string,
    // deno-lint-ignore no-explicit-any
    value: any,
    namespace = "",
    ttl = 0
  ): Promise<this> {
    const has = await this.has(key);
    if (has)
      await this.query(
        `UPDATE ${this.table} SET value = $1, ttl = $4 WHERE key = $2 AND ns = $3`,
        [value, key, namespace, ttl]
      );
    else
      await this.query(
        `INSERT INTO ${this.table} (key, value, ns, ttl) VALUES ($1, $2, $3, $4)`,
        [key, value, namespace, ttl]
      );
    return this;
  }

  async clear(namespace = ""): Promise<this> {
    await this.query(`DELETE FROM ${this.table} WHERE ns = $1`, [namespace]);
    return this;
  }

  async delete(key: string, namespace = ""): Promise<boolean> {
    const has = await this.has(key);
    if (!has) return false;
    this.query(`DELETE FROM ${this.table} WHERE key = $1 AND ns = $2`, [
      key,
      namespace,
    ]);
    return true;
  }

  async keys(namespace = ""): Promise<string[]> {
    return (
      await this.query<{ key: string }>(
        `SELECT key FROM ${this.table} WHERE ns = $1`,
        [namespace]
      )
    ).map((e) => e.key);
  }

  async deleteExpired(namespace = ""): Promise<void> {
    await this.query(
      `DELETE FROM ${this.table} WHERE ttl != 0 AND ttl < $1 AND ns = $2`,
      [Date.now(), namespace]
    );
  }
}

Adapters.register({
  protocol: "postgres",
  init(uri) {
    return PostgresAdapter.connect(uri.toString());
  },
});

export { Keydb };
