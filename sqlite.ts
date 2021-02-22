import { DB } from "https://deno.land/x/sqlite@v2.3.2/mod.ts";
import { Adapter, Adapters, KeydbFields } from "./adapter.ts";
import { Keydb } from "./keydb.ts";

export class SqliteAdapter implements Adapter {
  db: DB;
  table: string;

  constructor(path?: string, table: string = "keydb") {
    this.db = new DB(path);
    this.table = table;
    this.query(
      `CREATE TABLE IF NOT EXISTS ${this.table} (key VARCHAR(255), value TEXT, ns VARCHAR(255), ttl INTEGER)`
    );
  }

  // deno-lint-ignore no-explicit-any
  query<T = any>(sql: string, params: any[] = []): T[] {
    return [...this.db.query(sql, params).asObjects()] as T[];
  }

  get(key: string, namespace = ""): KeydbFields | undefined {
    const res = this.query<{
      key: string;
      value: string;
      ns: string;
      ttl: number;
    }>(`SELECT * FROM ${this.table} WHERE key = ? AND ns = ?`, [
      key,
      namespace,
    ])[0];
    return res;
  }

  has(key: string, namespace = ""): boolean {
    const res = this.query<{ key: string }>(
      `SELECT key FROM ${this.table} WHERE key = ? AND ns = ?`,
      [key, namespace]
    );
    return res.length > 0;
  }

  // deno-lint-ignore no-explicit-any
  set(key: string, value: any, namespace = "", ttl = 0): this {
    if (this.has(key))
      this.query(
        `UPDATE ${this.table} SET value = ?, ttl = ? WHERE key = ? AND ns = ?`,
        [value, ttl, key, namespace]
      );
    else
      this.query(
        `INSERT INTO ${this.table} (key, value, ns, ttl) VALUES (?, ?, ?, ?)`,
        [key, value, namespace, ttl]
      );
    return this;
  }

  clear(namespace = ""): this {
    this.query(`DELETE FROM ${this.table} WHERE ns = ?`, [namespace]);
    return this;
  }

  delete(key: string, namespace = ""): boolean {
    if (!this.has(key)) return false;
    this.query(`DELETE FROM ${this.table} WHERE key = ? AND ns = ?`, [
      key,
      namespace,
    ]);
    return true;
  }

  keys(namespace = ""): string[] {
    return this.query<{ key: string }>(
      `SELECT key FROM ${this.table} WHERE ns = ?`,
      [namespace]
    ).map((e) => e.key);
  }

  deleteExpired(namespace = ""): void {
    this.query(
      `DELETE FROM ${this.table} WHERE ns = ? AND ttl != 0 AND ttl < ?`,
      [namespace, Date.now()]
    );
  }
}

Adapters.register({
  protocol: "sqlite",
  init(uri) {
    let path: string | undefined = uri.toString().slice(7);
    if (path.startsWith("//")) path = path.slice(2);
    if (path == "memory") path = undefined;
    return new SqliteAdapter(path);
  },
});

export { Keydb };
