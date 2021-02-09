import { Keydb } from "./sqlite.ts";
import { assertEquals } from "https://deno.land/std@0.86.0/testing/asserts.ts";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
let db: Keydb;

Deno.test({
  name: "Connect to DB",
  sanitizeResources: false,
  async fn() {
    db = new Keydb("sqlite://memory");
    await db.awaitReady;
  },
});

Deno.test({
  name: "Clear DB",
  async fn() {
    await db.clear();
    const keys = await db.keys();
    assertEquals(keys.length, 0);
  },
});

Deno.test({
  name: "Set values",
  async fn() {
    await db.set("test_string", "hello world");
    await db.set("test_number", 69);
    await db.set("test_json", { hello: "world", cool: true, rate: 100 });
    const map = new Map();
    map.set("key", "value");
    await db.set("test_map", map);
    const keys = await db.keys();
    assertEquals(keys.length, 4);
  },
});

Deno.test({
  name: "Get Values",
  async fn() {
    const test_string = await db.get("test_string");
    assertEquals(test_string, "hello world");
    const test_number = await db.get("test_number");
    assertEquals(test_number, 69);
    const test_json = await db.get("test_json");
    assertEquals(typeof test_json, "object");
    const test_map = await db.get("test_map");
    assertEquals("value", test_map.get("key"));
  },
});

Deno.test({
  name: "Delete Key",
  async fn() {
    let test_number = await db.get("test_number");
    assertEquals(test_number, 69);
    await db.delete("test_number");
    test_number = await db.get("test_number");
    assertEquals(test_number, undefined);
    const keys = await db.keys();
    assertEquals(keys.length, 3);
  },
});

Deno.test({
  name: "TTL Values",
  async fn() {
    await db.set("test_ttl", "exists", 500);
    assertEquals("exists", await db.get("test_ttl"));
    await sleep(500);
    assertEquals(undefined, await db.get("test_ttl"));
  },
});

Deno.test({
  name: "Clean Up",
  async fn() {
    await db.clear();
    const keys = await db.keys();
    assertEquals(keys.length, 0);
  },
});
