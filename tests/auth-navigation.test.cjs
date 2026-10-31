const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function harness({
  register = false,
  role = "CUSTOMER",
  search = "",
  fail = false,
} = {}) {
  const states = [],
    navigations = [];
  let cursor = 0,
    callbacks = [],
    currentUser = null,
    formVersion = 0,
    lastFormKey;
  const account = { id: "api-user", role, name: "Nama Pengguna" };
  const authenticate = async () => {
    if (fail) throw new Error("Email/password salah");
    currentUser = account;
    formVersion++;
    return account;
  };
  const react = {
    useState: (initial) => {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [
        states[index],
        (next) => {
          states[index] = next;
        },
      ];
    },
    useEffect: (callback) => callbacks.push(callback),
  };
  const jsx = {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  };
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync("src/components/auth/AuthForm.tsx", "utf8"),
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
    URLSearchParams,
    window: { location: { search } },
    require: (name) =>
      ({
        react,
        "react/jsx-runtime": jsx,
        "next/navigation": {
          useRouter: () => ({ replace: (path) => navigations.push(path) }),
        },
        "next/link": { default: "link" },
        "lucide-react": {},
        "./AuthProvider": {
          useAuth: () => ({
            user: currentUser,
            formVersion,
            ready: true,
            signIn: authenticate,
            signUp: authenticate,
          }),
          dashboardPath: (r) =>
            r === "ADMIN"
              ? "/admin"
              : r === "LAWYER"
                ? "/lawyer/dashboard"
                : "/customer/dashboard",
        },
      })[name],
  });
  function render() {
    cursor = 0;
    callbacks = [];
    const wrapper = exports.default({ register });
    if (wrapper.key !== lastFormKey) {
      states.length = 0;
      lastFormKey = wrapper.key;
    }
    const tree = wrapper.type(wrapper.props);
    callbacks.forEach((callback) => callback());
    return tree;
  }
  function find(tree, predicate) {
    if (!tree || typeof tree !== "object") return null;
    if (predicate(tree)) return tree;
    for (const child of [tree.props?.children].flat(Infinity)) {
      const result = find(child, predicate);
      if (result) return result;
    }
    return null;
  }
  return {
    render,
    find,
    navigations,
    setUser: (value) => {
      currentUser = value;
      formVersion++;
    },
  };
}
for (const register of [false, true]) {
  test(`${register ? "Sign Up" : "Sign In"} navigates after the committed session render, without manual refresh`, async () => {
    const h = harness({ register, role: "LAWYER" });
    const form = h.find(h.render(), (node) => node.type === "form");
    await form.props.onSubmit({ preventDefault() {} });
    assert.equal(h.navigations.length, 0);
    h.render();
    assert.equal(h.navigations.at(-1), "/lawyer/dashboard");
  });
}
test("failed login restores the submit button and shows an actionable error", async () => {
  const h = harness({ fail: true });
  const form = h.find(h.render(), (node) => node.type === "form");
  await form.props.onSubmit({ preventDefault() {} });
  const tree = h.render();
  const button = h.find(
    tree,
    (node) => node.type === "button" && node.props.type === "submit",
  );
  assert.equal(button.props.disabled, false);
  assert.ok(h.find(tree, (node) => node.props?.role === "alert"));
  assert.equal(h.navigations.length, 0);
});
test("an existing session redirects away from auth pages", () => {
  const h = harness();
  h.setUser({ role: "ADMIN" });
  h.render();
  assert.equal(h.navigations.at(-1), "/admin");
});
test("customer return navigation accepts a lawyer profile and rejects external URLs", () => {
  for (const [search, expected] of [
    ["?next=/lawyers/abc-123", "/lawyers/abc-123"],
    ["?next=https://foreign.example", "/customer/dashboard"],
  ]) {
    const h = harness({ search });
    h.setUser({ role: "CUSTOMER" });
    h.render();
    assert.equal(h.navigations.at(-1), expected);
  }
});

for (const register of [false, true]) {
  test(`${register ? "Sign Up" : "Sign In"} clears cached credentials after login and logout even without an intermediate form render`, () => {
    const h = harness({ register });
    let tree = h.render();
    h.find(
      tree,
      (node) => node.type === "input" && node.props.type === "email",
    ).props.onChange({ target: { value: "previous@example.com" } });
    h.find(
      tree,
      (node) =>
        node.type === "input" &&
        node.props.placeholder ===
          (register ? "Minimal 8 karakter" : "Password Anda"),
    ).props.onChange({ target: { value: "PreviousPassword123!" } });
    if (register) {
      h.find(
        tree,
        (node) =>
          node.type === "input" &&
          node.props.placeholder === "Nama lengkap Anda",
      ).props.onChange({ target: { value: "Nama Lama" } });
      h.find(
        tree,
        (node) => node.type === "input" && node.props.type === "tel",
      ).props.onChange({ target: { value: "081234567890" } });
      h.find(
        tree,
        (node) =>
          node.type === "input" &&
          node.props.type === "password" &&
          !node.props.placeholder,
      ).props.onChange({ target: { value: "PreviousPassword123!" } });
    } else {
      h.find(
        tree,
        (node) => node.type === "input" && node.props.type === "checkbox",
      ).props.onChange({ target: { checked: true } });
    }
    assert.equal(
      h.find(
        h.render(),
        (node) => node.type === "input" && node.props.type === "email",
      ).props.value,
      "previous@example.com",
    );
    h.setUser({ id: "previous-user", role: "CUSTOMER" });
    h.setUser(null);
    tree = h.render();
    assert.equal(
      h.find(
        tree,
        (node) => node.type === "input" && node.props.type === "email",
      ).props.value,
      "",
    );
    assert.equal(
      h.find(
        tree,
        (node) => node.type === "input" && node.props.type === "password",
      ).props.value,
      "",
    );
    assert.equal(
      h.find(tree, (node) => node.type === "form").props.autoComplete,
      "off",
    );
    if (register) {
      assert.equal(
        h.find(
          tree,
          (node) =>
            node.type === "input" &&
            node.props.placeholder === "Nama lengkap Anda",
        ).props.value,
        "",
      );
      assert.equal(
        h.find(
          tree,
          (node) => node.type === "input" && node.props.type === "tel",
        ).props.value,
        "",
      );
      assert.equal(
        h.find(
          tree,
          (node) =>
            node.type === "input" &&
            node.props.type === "password" &&
            !node.props.placeholder,
        ).props.value,
        "",
      );
    } else {
      assert.equal(
        h.find(
          tree,
          (node) => node.type === "input" && node.props.type === "checkbox",
        ).props.checked,
        false,
      );
    }
  });
}
