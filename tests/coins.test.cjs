const { loadTS } = require("./load-ts.cjs");

const test = require("node:test");

const assert = require("node:assert/strict");

const fs = require("node:fs");

const vm = require("node:vm");

const ts = require("typescript");

function load(path) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require,
    console,
  });

  return exports;
}

const { initialCoinStore, applyTopUp, applyConsultation, isCoinStore } = load(
  "src/store/coinLedger.ts",
);

const { publicLawyers } = load("src/data/publicData.ts");

const topup = (overrides = {}) => ({
  userId: "demo-customer",
  coins: 100,
  method: "QRIS",
  requestId: "topup-1",
  id: "tx-1",
  now: "2026-10-30T04:00:00.000Z",
  ...overrides,
});

const booking = (overrides = {}) => ({
  userId: "demo-customer",
  name: "Aulia Rahma",
  lawyer: publicLawyers[0],
  brief: "Saya ingin berkonsultasi mengenai dokumen keluarga.",
  requestId: "booking-1",
  id: "consult-1",
  now: "2026-10-30T04:30:00.000Z",
  ...overrides,
});

test("top up updates balance once, preserves seed, and survives JSON roundtrip", () => {
  const seed = initialCoinStore();
  const next = applyTopUp(seed, topup());
  assert.equal(seed.balances["demo-customer"], 120);
  assert.equal(next.balances["demo-customer"], 220);
  assert.equal(next.transactions[0].balanceAfter, 220);
  assert.equal(next.transactions[0].coins, 100);
  assert.equal(applyTopUp(next, topup()), next);
  const restored = JSON.parse(JSON.stringify(next));
  assert.equal(isCoinStore(restored), true);
  assert.equal(restored.balances["demo-customer"], 220);
});

test("consultation payment debits once and creates a pending request linked to the receipt", () => {
  const paid = applyConsultation(initialCoinStore(), booking());
  assert.equal(paid.balances["demo-customer"], 70);
  assert.equal(paid.consultations[0].status, "Pending");
  assert.equal(paid.consultations[0].customerId, "demo-customer");
  assert.equal(paid.transactions[0].coins, -50);
  assert.equal(paid.transactions[0].consultationId, paid.consultations[0].id);
  assert.equal(applyConsultation(paid, booking()), paid);
  assert.throws(
    () =>
      applyConsultation(
        paid,
        booking({
          requestId: "second-click",
          id: "second-id",
        }),
      ),
    /sudah memiliki/,
  );
});

test("insufficient balance, offline lawyer and invalid brief do not mutate the ledger", () => {
  const seed = initialCoinStore(),
    snapshot = JSON.stringify(seed);
  assert.throws(
    () =>
      applyConsultation(
        seed,
        booking({
          userId: "new-customer",
        }),
      ),
    /tidak mencukupi/,
  );
  assert.throws(
    () =>
      applyConsultation(
        seed,
        booking({
          lawyer: publicLawyers[2],
        }),
      ),
    /belum tersedia/,
  );
  assert.throws(
    () =>
      applyConsultation(
        seed,
        booking({
          brief: "short",
        }),
      ),
    /10–1.500/,
  );
  assert.equal(JSON.stringify(seed), snapshot);
});

test("a new Customer starts at zero and cannot spend another Customer balance", () => {
  const funded = applyTopUp(
    initialCoinStore(),
    topup({
      userId: "new-customer",
      coins: 50,
    }),
  );
  assert.equal(funded.balances["new-customer"], 50);
  assert.equal(funded.balances["demo-customer"], 120);
  const paid = applyConsultation(
    funded,
    booking({
      userId: "new-customer",
    }),
  );
  assert.equal(paid.balances["new-customer"], 0);
  assert.equal(paid.balances["demo-customer"], 120);
  assert.equal(
    paid.transactions.filter((t) => t.userId === "new-customer").length,
    2,
  );
});

test("invalid packages, methods, and malformed persisted data are rejected", () => {
  const seed = initialCoinStore();
  assert.throws(
    () =>
      applyTopUp(
        seed,
        topup({
          coins: -50,
        }),
      ),
    /tidak valid/,
  );
  assert.throws(
    () =>
      applyTopUp(
        seed,
        topup({
          coins: 51,
        }),
      ),
    /tidak valid/,
  );
  assert.throws(
    () =>
      applyTopUp(
        seed,
        topup({
          method: "real-payment",
        }),
      ),
    /tidak valid/,
  );
  assert.equal(
    isCoinStore({
      ...seed,
      balances: {
        bad: -1,
      },
    }),
    false,
  );
  assert.equal(
    isCoinStore({
      ...seed,
      transactions: [{}],
    }),
    false,
  );
  assert.equal(
    isCoinStore({
      ...seed,
      consultations: [{}],
    }),
    false,
  );
  assert.equal(isCoinStore(null), false);
});

test("ledger always reconciles balances with transaction deltas after a topup and booking", () => {
  let state = applyTopUp(
    initialCoinStore(),
    topup({
      coins: 250,
    }),
  );
  state = applyConsultation(state, booking());
  const total = state.transactions
    .filter((t) => t.userId === "demo-customer")
    .reduce((sum, t) => sum + t.coins, 0);
  assert.equal(state.balances["demo-customer"], total);
  assert.equal(state.transactions[0].balanceAfter, total);
  assert.equal(initialCoinStore().balances["demo-customer"], 120);
});

function providerHarness(
  storage,
  locks,
  actor = {
    id: "demo-customer",
    name: "Aulia Rahma",
    role: "CUSTOMER",
  },
) {
  const { webcrypto } = require("node:crypto");
  const ledger = load("src/store/coinLedger.ts");
  const exports = {};
  let stateIndex = 0,
    visibleState = ledger.initialCoinStore();
  const react = {
    createContext: () => ({
      Provider: "provider",
    }),
    useContext: () => null,
    useEffect: () => {},
    useRef: (value) => ({
      current: value,
    }),
    useState: (initial) => {
      const index = stateIndex++;

      return [
        index === 1
          ? true
          : typeof initial === "function"
            ? initial()
            : initial,
        (value) => {
          if (index === 0) visibleState = value;
        },
      ];
    },
  };
  const jsx = {
    jsx: (type, props) => ({
      type,
      props,
    }),
    jsxs: (type, props) => ({
      type,
      props,
    }),
  };
  const source = ts.transpileModule(
    fs.readFileSync("src/store/CoinProvider.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  const modules = {
    react,
    "react/jsx-runtime": jsx,
    "@/components/auth/AuthProvider": {
      useAuth: () => ({
        user: actor,
      }),
    },
    "@/data/publicData": {
      publicLawyers,
    },
    "./coinLedger": ledger,
    "./platform": loadTS("src/store/platform.ts"),
  };
  vm.runInNewContext(source, {
    exports,
    require: (name) => modules[name] || require(name),
    localStorage: storage,
    navigator: {
      locks,
    },
    crypto: webcrypto,
    console,
  });
  const context = exports.CoinProvider({
    children: null,
  }).props.value;

  return {
    context,
    get visibleState() {
      return visibleState;
    },
  };
}

function storageHarness() {
  const values = new Map();

  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("provider persists the complete ledger before publishing balance, and rejects write failure", async () => {
  const storage = storageHarness(),
    h = providerHarness(storage);
  await h.context.topUp(100, "QRIS", "persist-1");
  const saved = JSON.parse(storage.getItem("hilaw-coins-v1"));
  assert.equal(saved.balances["demo-customer"], 220);
  assert.equal(h.visibleState.balances["demo-customer"], 220);
  storage.setItem = () => {
    throw new Error("Storage quota exceeded");
  };
  await assert.rejects(
    h.context.topUp(50, "QRIS", "failed-write"),
    /Storage quota|Penyimpanan gagal/,
  );
  assert.equal(h.visibleState.balances["demo-customer"], 220);
  assert.equal(
    JSON.parse(storage.getItem("hilaw-coins-v1")).balances["demo-customer"],
    220,
  );
});

test("two provider instances serialize transactions and re-read the current persisted balance", async () => {
  const storage = storageHarness();
  let queue = Promise.resolve();
  const locks = {
    request: (_key, callback) => {
      const task = queue.then(callback);
      queue = task.catch(() => {});

      return task;
    },
  };
  const a = providerHarness(storage, locks),
    b = providerHarness(storage, locks);
  await Promise.all([
    a.context.topUp(50, "QRIS", "tab-a"),
    b.context.topUp(100, "GoPay", "tab-b"),
  ]);
  assert.equal(
    JSON.parse(storage.getItem("hilaw-coins-v1")).balances["demo-customer"],
    270,
  );
  const restored = providerHarness(storage, locks);
  await restored.context.topUp(100, "GoPay", "tab-b");
  assert.equal(
    JSON.parse(storage.getItem("hilaw-coins-v1")).balances["demo-customer"],
    270,
  );
});

test("provider records consultation and returns its id, including retry with the same request", async () => {
  const storage = storageHarness(),
    h = providerHarness(storage);
  const first = await h.context.book(
    "nadira",
    "Saya ingin berkonsultasi mengenai dokumen keluarga.",
    "book-provider",
  );
  const second = await h.context.book(
    "nadira",
    "Saya ingin berkonsultasi mengenai dokumen keluarga.",
    "book-provider",
  );
  assert.equal(first, second);
  const saved = JSON.parse(storage.getItem("hilaw-coins-v1"));
  assert.equal(saved.balances["demo-customer"], 70);
  assert.equal(
    saved.consultations.filter((c) => c.status === "Pending").length,
    1,
  );
  await h.context.reset();
  assert.equal(
    JSON.parse(storage.getItem("hilaw-coins-v1")).balances["demo-customer"],
    120,
  );
});

test("Admin settings save valid contact, reject invalid contact and remain restricted by role", async () => {
  const storage = storageHarness(),
    customer = providerHarness(storage);
  await assert.rejects(
    customer.context.saveSettings("halo@hilaw.example", "HiLaw"),
    /Admin/,
  );
  const admin = providerHarness(storage, undefined, {
    id: "demo-admin",
    name: "Admin HiLaw",
    role: "ADMIN",
  });
  await admin.context.saveSettings("support@hilaw.example", "HiLaw Demo");
  let saved = JSON.parse(storage.getItem("hilaw-coins-v1"));
  assert.equal(saved.platform.settings.contact, "support@hilaw.example");
  assert.equal(saved.platform.settings.platformName, "HiLaw Demo");
  await assert.rejects(
    admin.context.saveSettings("invalid-email", "HiLaw"),
    /tidak valid/,
  );
  await admin.context.updateLawyer("nadira", {
    active: false,
  });
  saved = JSON.parse(storage.getItem("hilaw-coins-v1"));
  assert.equal(
    saved.platform.lawyers.find((l) => l.id === "nadira").active,
    false,
  );
  await assert.rejects(
    customer.context.book(
      "nadira",
      "Saya ingin konsultasi dokumen keluarga.",
      "disabled-booking",
    ),
    /belum aktif/,
  );
  assert.equal(
    JSON.parse(storage.getItem("hilaw-coins-v1")).balances["demo-customer"],
    120,
  );
});
