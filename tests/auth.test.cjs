const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const profile = {
  id: "api-user",
  full_name: "Akun Database",
  email: "akun@example.com",
  phone: "081234567890",
  role: "lawyer",
  avatar_url: null,
  lawyer_profile: null,
};
const session = {
  access_token: "test-access",
  refresh_token: "test-refresh",
  expires_at: 9999999999,
};
function harness({ handler, saved = null, effects = false } = {}) {
  const states = [],
    effectsQueue = [],
    listeners = new Map(),
    calls = [],
    saves = [];
  let savedSession = saved;
  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  }
  const apiModule = {
    ApiError,
    api: async (path, init = {}, authenticated = true) => {
      calls.push({ path, init, authenticated });
      return handler
        ? handler(path, init, authenticated, ApiError)
        : { session, profile };
    },
    restoreSession: () => !!savedSession,
    saveSession: (value, remember) => {
      savedSession = value;
      saves.push({ value, remember });
    },
  };
  const react = {
    useState: (initial) => {
      const index = states.length;
      states.push(initial);
      return [
        initial,
        (v) => {
          states[index] = typeof v === "function" ? v(states[index]) : v;
        },
      ];
    },
    useRef: (value) => ({ current: value }),
    useEffect: (callback) => effectsQueue.push(callback),
  };
  const jsx = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  };
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync("src/components/auth/BackendAuthProvider.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    require: (name) =>
      ({
        react,
        "react/jsx-runtime": jsx,
        "./AuthProvider": { AuthContext: { Provider: "provider" } },
        "@/lib/api": apiModule,
        "@/components/ui/Toast": { Toast: () => null },
      })[name],
    window: {
      addEventListener: (key, callback) => listeners.set(key, callback),
      removeEventListener: (key) => listeners.delete(key),
    },
    localStorage: {
      getItem: () => {
        throw new Error("Legacy account storage must not be read");
      },
    },
  });
  const auth = exports.BackendAuthProvider({ children: null }).props.value;
  if (effects) effectsQueue.forEach((callback) => callback());
  return {
    auth,
    calls,
    saves,
    get user() {
      return states[0];
    },
    get notice() {
      return states[2];
    },
    get session() {
      return savedSession;
    },
    storageEvent: (key) => listeners.get("storage")?.({ key }),
  };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
test("signin always calls API and uses the server profile and remember setting", async () => {
  const h = harness();
  const account = await h.auth.signIn(" akun@example.com ", "password", true);
  assert.equal(h.calls[0].path, "/auth/signin");
  assert.equal(h.calls[0].authenticated, false);
  assert.equal(JSON.parse(h.calls[0].init.body).email, "akun@example.com");
  assert.equal(account.id, profile.id);
  assert.equal(account.role, "LAWYER");
  assert.equal(h.saves[0].remember, true);
  assert.equal(h.auth.switchRole, undefined);
});
test("old demo credentials cannot bypass a backend error", async () => {
  const h = harness({
    handler: (_path, _init, _auth, ErrorType) => {
      throw new ErrorType(401, "Email/password tidak sesuai");
    },
  });
  await assert.rejects(
    h.auth.signIn("admin@hilaw.demo", "HiLaw123!", true),
    /tidak sesuai/,
  );
  assert.equal(h.user, null);
  assert.equal(h.saves.length, 0);
});
test("signup posts new account to API and does not write a local account", async () => {
  const h = harness();
  const account = await h.auth.signUp(
    {
      name: "Nama Baru",
      email: "baru@example.com",
      phone: "081234567890",
      role: "LAWYER",
    },
    "password",
  );
  const payload = JSON.parse(h.calls[0].init.body);
  assert.equal(h.calls[0].path, "/auth/signup");
  assert.equal(payload.full_name, "Nama Baru");
  assert.equal(payload.role, "lawyer");
  assert.equal(payload.confirm_password, "password");
  assert.equal(account.id, profile.id);
  assert.equal(h.saves[0].remember, false);
});
test("missing session requires Sign In without asking for email confirmation", async () => {
  const h = harness({
    handler: () => ({
      session: null,
      profile: null,
      email_confirmation_required: true,
    }),
  });
  assert.equal(
    await h.auth.signUp(
      {
        name: "Nama Baru",
        email: "baru@example.com",
        phone: "",
        role: "CUSTOMER",
      },
      "password",
    ),
    null,
  );
  assert.equal(h.user, null);
  assert.equal(h.saves.length, 0);
  assert.match(h.notice, /Sign In/);
});
test("session restoration reads identity from API and ignores unrelated ledger events", async () => {
  const h = harness({ saved: session, effects: true, handler: () => profile });
  await flush();
  assert.equal(h.calls[0].path, "/auth/me");
  assert.equal(h.user.id, profile.id);
  const count = h.calls.length;
  h.storageEvent("hilaw-coins-v1");
  await flush();
  assert.equal(h.calls.length, count);
});
test("logout revokes server session before clearing browser session", async () => {
  const h = harness({ saved: session, handler: () => null });
  await h.auth.logout();
  assert.equal(h.calls[0].path, "/auth/signout");
  assert.equal(h.session, null);
  assert.equal(h.user, null);
});
test("failed signout keeps the session available for retry", async () => {
  const h = harness({
    saved: session,
    handler: (_p, _i, _a, ErrorType) => {
      throw new ErrorType(502, "Gagal mencabut sesi");
    },
  });
  await assert.rejects(h.auth.logout(), /Gagal mencabut sesi/);
  assert.equal(h.session.access_token, session.access_token);
  assert.match(h.notice, /Gagal/);
});
test("a delayed restore cannot log the user back in after logout", async () => {
  let resolveProfile;
  const h = harness({
    saved: session,
    effects: true,
    handler: (path) =>
      path === "/auth/me"
        ? new Promise((resolve) => {
            resolveProfile = resolve;
          })
        : null,
  });
  await h.auth.logout();
  resolveProfile(profile);
  await flush();
  assert.equal(h.user, null);
});

test("a delayed login cannot restore an account after logout", async () => {
  let finish;
  const h = harness({
    handler: (path) =>
      path === "/auth/signin"
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : null,
  });
  const pending = h.auth.signIn("akun@example.com", "password", false);
  await h.auth.logout();
  finish({ session, profile });
  await assert.rejects(pending, /dibatalkan/);
  assert.equal(h.user, null);
  assert.equal(h.session, null);
});
test("a delayed logout cannot clear a newer login session", async () => {
  let finish;
  const h = harness({
    handler: (path) =>
      path === "/auth/signout"
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : { session, profile },
  });
  const pending = h.auth.logout();
  await h.auth.signIn("akun@example.com", "password", false);
  finish(null);
  await pending;
  assert.equal(h.user.id, profile.id);
  assert.equal(h.session.access_token, session.access_token);
});
