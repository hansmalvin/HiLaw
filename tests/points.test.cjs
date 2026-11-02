const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTS } = require("./load-ts.cjs");
const { earnings, toConsultation } = loadTS("src/store/coinLedger.ts");

const session = (id, rate, status, lawyer = "lawyer-a") =>
  toConsultation({
    id,
    customer_id: "customer",
    customer_name: "Customer",
    lawyer_id: lawyer,
    lawyer_user_id: "user-" + lawyer,
    lawyer_name: "Pengacara",
    specialization: "Hukum Pidana",
    rate,
    duration_minutes: 30,
    status,
    brief: "Kronologi singkat kasus.",
    started_at: null,
    ended_at: null,
    created_at: "2026-11-02T00:00:00.000Z",
  });

test("earnings use the same per-session floor(20%) fee as transition_consultation()", () => {
  const all = [
    session("a", 35, "Completed"),
    session("b", 36, "Completed"),
    session("c", 50, "Cancelled"),
    session("d", 99, "Ongoing"),
    session("e", 100, "Completed", "lawyer-b"),
  ];
  // 35 -> fee 7, 36 -> fee 7 (not 7.2): fees stay whole Poin like the SQL ledger.
  assert.deepEqual(
    { ...earnings(all, "lawyer-a"), completed: undefined },
    { completed: undefined, gross: 71, platform: 14, lawyer: 57 },
  );
  const total = earnings(all);
  assert.equal(total.completed.length, 3);
  assert.equal(total.platform, 34);
  assert.equal(total.lawyer + total.platform, total.gross);
});

test("package prices match package_price() in migration 005, including float traps", () => {
  const { packagePrice } = loadTS("src/store/coinLedger.ts");
  // Same fixtures as backend/supabase/tests/session_packages.sql.
  assert.equal(packagePrice(5, 15), 3);
  assert.equal(packagePrice(35, 15), 21);
  assert.equal(packagePrice(35, 30), 35);
  assert.equal(packagePrice(35, 60), 63);
  assert.equal(packagePrice(1, 15), 1);
  for (let rate = 1; rate <= 10000; rate++) {
    assert.equal(packagePrice(rate, 15), Math.ceil((rate * 6) / 10));
    // Rounding up means very low rates (1-4 Poin) get no discount, hence "hemat hingga 10%".
    assert.ok(packagePrice(rate, 60) <= rate * 2);
  }
});
