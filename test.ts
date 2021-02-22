import { Keydb } from "./sqlite.ts";
import { assertEquals } from "https://deno.land/std@0.86.0/testing/asserts.ts";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
let db: Keydb;

Deno.test({
  name: "Connect to DB",
  sanitizeResources: false,
  async fn() {
    db = new Keydb("sqlite://test.sqlite");
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
    const testString = await db.get("test_string");
    assertEquals(testString, "hello world");
    const testNumber = await db.get("test_number");
    assertEquals(testNumber, 69);
    const testJson = await db.get("test_json");
    assertEquals(typeof testJson, "object");
    const testMap = await db.get("test_map");
    assertEquals("value", testMap.get("key"));
  },
});

Deno.test({
  name: "Delete Key",
  async fn() {
    let testNumber = await db.get("test_number");
    assertEquals(testNumber, 69);
    await db.delete("test_number");
    testNumber = await db.get("test_number");
    assertEquals(testNumber, undefined);
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
