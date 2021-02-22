# Keydb

Simple Key-value storage module with support for multiple database backends - with a common Promise-based interface for all. *Heavily* inspired from [Node.js Keyv](https://npmjs.org/package/keyv).

## Features

- Supports all JSON types, Buffers and Map.
- Multiple database backends can be integrated - and custom ones too.
- Supports TTL - making it suitable for persistent cache.

## Import

- Main: https://raw.githubusercontent.com/DjDeveloperr/Keydb/main/mod.ts
- Stable: https://deno.land/x/keydb/mod.ts

Note: You have to import adapters from their own files! They aren't exported from `mod.ts` to prevent downloading all supported Database drivers and their adapters!

## Usage

```ts
import { Keydb } from "https://deno.land/x/keydb/sqlite.ts";

const db = new Keydb("sqlite://database.sqlite"); // or new Keydb(new SqliteAdapter("database.sqlite"))

await db.set('foo', 'expires in 1 second', 1000);
await db.set('foo', 'never expires');
await db.get('foo'); // 'never expires'
await db.delete('foo'); // true
await db.clear(); // wipes out all keys!
```

## Adapters

These are currently supported official Adapters.

| Database | Import                                        |
| -------- | --------------------------------------------- |
| SQLIte   | [Here](https://deno.land/x/keydb/sqlite.ts)   |
| Postgres | [Here](https://deno.land/x/keydb/postgres.ts) |

## Contributing

You're always welcome to contribute!

- We use `deno fmt` to format code.
- We use `deno lint` for linting.

## License

See [LICENSE](LICENSE) for more info.

Copyright 2021 @ DjDeveloperr