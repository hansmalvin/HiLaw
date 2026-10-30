const test = require("node:test");

const assert = require("node:assert/strict");

const fs = require("node:fs");

const vm = require("node:vm");

const ts = require("typescript");

const { webcrypto } = require("node:crypto");

const { loadTS } = require("./load-ts.cjs");

// Execute the real provider actions with browser storage and React hooks substituted.
// Browser navigation and DOM interactions still require a manual browser check.

function harness({ effects = false } = {}) {
  const memory = () => {
    const data = new Map();

    return {
      getItem: (k) => data.get(k) || null,
      setItem: (k, v) => data.set(k, v),
      removeItem: (k) => data.delete(k),
    };
  };
  const localStorage = memory(),
    sessionStorage = memory();
  let currentUser = null,
    userUpdates = 0;
  const pendingEffects = [],
    listeners = new Map();
  let stateIndex = 0;
  const react = {
    createContext: () => ({
      Provider: "provider",
    }),
    useContext: () => null,
    useEffect: (callback) => pendingEffects.push(callback),
    useState: (initial) => {
      const index = stateIndex++;

      return [
        initial,
        (value) => {
          if (index === 0) {
            currentUser = value;
            userUpdates++;
          }
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
    fs.readFileSync("src/components/auth/AuthProvider.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: (name) =>
      name === "@/data/publicData"
        ? loadTS("src/data/publicData.ts")
        : name === "react"
          ? react
          : name === "react/jsx-runtime"
            ? jsx
            : require(name),
    localStorage,
    sessionStorage,
    crypto: webcrypto,
    TextEncoder,
    console,
    window: {
      addEventListener: (event, callback) => listeners.set(event, callback),
      removeEventListener: (event) => listeners.delete(event),
    },
  });
  const auth = exports.AuthProvider({
    children: null,
  }).props.value;
  if (effects) pendingEffects.forEach((callback) => callback());

  return {
    auth,
    localStorage,
    sessionStorage,
    get user() {
      return currentUser;
    },
    get userUpdates() {
      return userUpdates;
    },
    storageEvent: (key) =>
      listeners.get("storage")?.({
        key,
      }),
  };
}

test("demo roles authenticate and Remember Me selects storage", async () => {
  for (const [role, email] of [
    ["CUSTOMER", "customer@hilaw.demo"],
    ["LAWYER", "lawyer@hilaw.demo"],
    ["ADMIN", "admin@hilaw.demo"],
  ]) {
    const h = harness();
    const account = await h.auth.signIn(email, "HiLaw123!", true);
    assert.equal(account.role, role);
    assert.equal(h.user.role, role);
    assert.ok(h.localStorage.getItem("hilaw-auth-session-v1"));
    assert.equal(h.sessionStorage.getItem("hilaw-auth-session-v1"), null);
    await h.auth.signIn(email, "HiLaw123!", false);
    assert.equal(h.localStorage.getItem("hilaw-auth-session-v1"), null);
    assert.ok(h.sessionStorage.getItem("hilaw-auth-session-v1"));
    h.auth.logout();
    assert.equal(h.user, null);
    assert.equal(h.sessionStorage.getItem("hilaw-auth-session-v1"), null);
  }
});

test("invalid credentials do not establish a session", async () => {
  const h = harness();
  await assert.rejects(
    h.auth.signIn("admin@hilaw.demo", "wrong", true),
    /Email atau password/,
  );
  assert.equal(h.user, null);
});

test("registration persists account, rejects duplicates and excludes public admin", async () => {
  const h = harness();
  const input = {
    name: "Customer Baru",
    email: "BARU@example.com",
    phone: "081234567890",
    role: "CUSTOMER",
  };
  await h.auth.signUp(input, "DemoOnly123!");
  assert.equal(h.user.email, "baru@example.com");
  const saved = h.localStorage.getItem("hilaw-auth-accounts-v1");
  assert.ok(saved);
  assert.equal(saved.includes("DemoOnly123!"), false);
  h.auth.logout();
  assert.equal(
    (await h.auth.signIn("baru@example.com", "DemoOnly123!", false)).name,
    "Customer Baru",
  );
  await assert.rejects(h.auth.signUp(input, "DemoOnly123!"), /sudah terdaftar/);
  await assert.rejects(
    h.auth.signUp(
      {
        ...input,
        email: "other@example.com",
        role: "ADMIN",
      },
      "DemoOnly123!",
    ),
    /Pendaftaran publik/,
  );
});

test("role switcher uses demo identities and logout clears session", () => {
  const h = harness();
  h.auth.switchRole("LAWYER");
  assert.equal(h.user.id, "demo-lawyer");
  h.auth.switchRole("ADMIN");
  assert.equal(h.user.id, "demo-admin");
  h.auth.logout();
  assert.equal(h.user, null);
});

test("unrelated Coin storage events do not reauthenticate or create a synchronization feedback loop", async () => {
  const h = harness({
    effects: true,
  });
  await h.auth.signIn("customer@hilaw.demo", "HiLaw123!", true);
  const updates = h.userUpdates;
  h.storageEvent("hilaw-coins-v1");
  assert.equal(h.userUpdates, updates);
  assert.equal(h.user.id, "demo-customer");
  h.localStorage.removeItem("hilaw-auth-session-v1");
  h.storageEvent("hilaw-auth-session-v1");
  assert.equal(h.user, null);
});
