import { Buffer } from "https://deno.land/std@0.86.0/node/buffer.ts";

// deno-lint-ignore no-namespace
export namespace JSONB {
  // deno-lint-ignore no-explicit-any
  export const stringify = function stringify(o: any) {
    if ("undefined" == typeof o) return o;

    if (o && Buffer.isBuffer(o))
      return JSON.stringify(":base64:" + o.toString("base64"));
    if (o && o instanceof Map)
      return JSON.stringify(":map:" + JSON.stringify(Object.fromEntries(o)));

    if (o && o.toJSON) o = o.toJSON();

    if (o && "object" === typeof o) {
      var s = "";
      var array = Array.isArray(o);
      s = array ? "[" : "{";
      var first = true;

      for (var k in o) {
        var ignore =
          "function" == typeof o[k] || (!array && "undefined" === typeof o[k]);
        if (Object.hasOwnProperty.call(o, k) && !ignore) {
          if (!first) s += ",";
          first = false;
          if (array) {
            if (o[k] == undefined) s += "null";
            else s += stringify(o[k]);
          } else if (o[k] !== void 0) {
            s += stringify(k) + ":" + stringify(o[k]);
          }
        }
      }

      s += array ? "]" : "}";

      return s;
    } else if ("string" === typeof o) {
      return JSON.stringify(/^:/.test(o) ? ":" + o : o);
    } else if ("undefined" === typeof o) {
      return "null";
    } else return JSON.stringify(o);
  };

  export const parse = function (s: string) {
    return JSON.parse(s, function (_, value) {
      if ("string" === typeof value) {
        if (/^:base64:/.test(value))
          return Buffer.from(value.substring(8), "base64");
        if (/^:map:/.test(value))
          return new Map(Object.entries(JSON.parse(value.substring(5))));
        else return /^:/.test(value) ? value.substring(1) : value;
      }
      return value;
    });
  };
}
