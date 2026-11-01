const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { File } = require("node:buffer");

function harness(status, { fail = false } = {}) {
  const states = [],
    requests = [];
  let cursor = 0,
    mounted = false,
    refreshes = 0;
  let record = {
    lawyer: {
      verification_status: status,
      kta_number: "KTA-123",
      organization: "PERADI",
      specialization: "Hukum Pidana",
      experience_years: 5,
    },
    history:
      status === "not_submitted"
        ? []
        : [
            {
              id: "original",
              status,
              full_name: "Nama Terverifikasi",
              kta_file_path: "owner/demo.pdf",
            },
          ],
  };
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in states)) states[i] = initial;
      return [
        states[i],
        (value) => {
          states[i] = value;
        },
      ];
    },
    useCallback: (fn) => fn,
    useEffect: (fn) => {
      if (!mounted) fn();
    },
  };
  const jsx = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  };
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync(
      "src/components/operations/BackendVerification.tsx",
      "utf8",
    ),
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
    FormData,
    require: (name) =>
      ({
        react,
        "react/jsx-runtime": jsx,
        "@/lib/api": {
          api: async (path, options = {}) => {
            if (!options.method) return structuredClone(record);
            requests.push({ path, ...options });
            if (fail) throw new Error("Pengajuan gagal");
            record = {
              lawyer: { ...record.lawyer, verification_status: "pending" },
              history: [{ id: "new", status: "pending" }, ...record.history],
            };
            return record.history[0];
          },
          reloadRemote: () => {
            refreshes++;
          },
        },
        "@/components/auth/AuthProvider": {
          useAuth: () => ({ user: { name: "Nama Akun" } }),
        },
        "@/data/publicData": { categories: ["Hukum Pidana"] },
        "@/store/platform": { advocateOrganizations: ["PERADI"] },
        "@/components/ui/Modal": { Modal: "modal" },
        "@/components/customer/CustomerExperience": {},
      })[name],
  });
  function render() {
    cursor = 0;
    const tree = exports.BackendVerification();
    mounted = true;
    return tree;
  }
  function all(node, predicate) {
    if (!node || typeof node !== "object") return [];
    return [
      ...(predicate(node) ? [node] : []),
      ...[node.props?.children]
        .flat(Infinity)
        .flatMap((n) => all(n, predicate)),
    ];
  }
  function text(node) {
    if (typeof node === "string") return node;
    if (!node || typeof node !== "object") return "";
    return [node.props?.children].flat(Infinity).map(text).join("");
  }
  return {
    render,
    all,
    text,
    requests,
    async ready() {
      render();
      await Promise.resolve();
    },
    button(tree, label) {
      return all(tree, (n) => n.type === "button" && text(n) === label)[0];
    },
    selectFile(tree) {
      all(
        tree,
        (n) => n.type === "input" && n.props.type === "file",
      )[0].props.onChange({
        target: {
          files: [
            new File(["%PDF-1.7 demo"], "demo.pdf", {
              type: "application/pdf",
            }),
          ],
        },
      });
    },
    refreshes: () => refreshes,
  };
}

test("approved lawyer can edit prefilled data; cancel keeps approval without a request", async () => {
  const h = harness("approved");
  await h.ready();
  let tree = h.render();
  assert.ok(h.button(tree, "Lihat data verifikasi"));
  h.button(tree, "Edit & Ajukan Ulang").props.onClick();
  tree = h.render();
  const inputs = h.all(tree, (n) => n.type === "input");
  assert.equal(inputs[0].props.value, "Nama Terverifikasi");
  assert.equal(inputs[1].props.value, "KTA-123");
  const modal = h.all(tree, (n) => n.type === "modal")[0];
  assert.match(h.text(modal), /status kembali menjadi pending/);
  modal.props.onClose();
  tree = h.render();
  assert.ok(h.button(tree, "Edit & Ajukan Ulang"));
  assert.equal(h.requests.length, 0);
  assert.equal(h.refreshes(), 0);
});

for (const [status, label, method] of [
  ["not_submitted", "Ajukan Verifikasi", "POST"],
  ["approved", "Edit & Ajukan Ulang", "PUT"],
  ["rejected", "Perbaiki & Ajukan Ulang", "PUT"],
]) {
  test(`${status} submits via ${method} and refreshes pending state`, async () => {
    const h = harness(status);
    await h.ready();
    h.button(h.render(), label).props.onClick();
    let tree = h.render();
    h.all(tree, (n) => n.type === "input")[0].props.onChange({
      target: { value: "Nama Diperbarui" },
    });
    h.selectFile(tree);
    tree = h.render();
    await h
      .all(tree, (n) => n.type === "form")[0]
      .props.onSubmit({ preventDefault() {} });
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].method, method);
    assert.equal(h.requests[0].body.get("full_name"), "Nama Diperbarui");
    assert.equal(h.requests[0].body.get("kta_file").name, "demo.pdf");
    assert.equal(h.refreshes(), 1);
    tree = h.render();
    assert.match(h.text(tree), /Pengajuan pending/);
    assert.equal(h.button(tree, label), undefined);
    assert.equal(h.all(tree, (n) => n.type === "form").length, 0);
  });
}

test("pending lawyer only views data and cannot open an edit form", async () => {
  const h = harness("pending");
  await h.ready();
  const tree = h.render();
  assert.ok(h.button(tree, "Lihat data verifikasi"));
  assert.equal(h.button(tree, "Edit & Ajukan Ulang"), undefined);
  assert.equal(h.button(tree, "Ajukan Verifikasi"), undefined);
});

test("failed resubmission keeps approval and edited form available for retry", async () => {
  const h = harness("approved", { fail: true });
  await h.ready();
  h.button(h.render(), "Edit & Ajukan Ulang").props.onClick();
  h.selectFile(h.render());
  await h
    .all(h.render(), (n) => n.type === "form")[0]
    .props.onSubmit({ preventDefault() {} });
  const tree = h.render();
  assert.match(h.text(tree), /Pengajuan gagal/);
  assert.ok(h.button(tree, "Edit & Ajukan Ulang"));
  assert.ok(h.button(tree, "Kirim Pengajuan Ulang"));
  assert.equal(h.refreshes(), 0);
});
