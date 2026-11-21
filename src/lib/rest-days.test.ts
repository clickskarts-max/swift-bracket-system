import { test } from "node:test";
import { strictEqual } from "node:assert";
import { skipRestDates } from "./fixture-timing";

const at = (d: string) => new Date(`${d}T09:00`).toISOString();
test("games planned on a rest day move to the next day and later days shift too", () => {
  const out = skipRestDates([{ scheduled_at: at("2026-11-24") }, { scheduled_at: at("2026-11-25") }, { scheduled_at: at("2026-11-26") }], "2026-11-24", ["2026-11-25"]);
  strictEqual(out[0]?.scheduled_at, at("2026-11-24"));
  strictEqual(out[1]?.scheduled_at, at("2026-11-26"));
  strictEqual(out[2]?.scheduled_at, at("2026-11-27"));
});
