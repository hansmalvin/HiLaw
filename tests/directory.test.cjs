const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function harness() {
  const states = [];
  let cursor = 0;
  const lawyers = [
    { id: "unrated", name: "Nama A", rate: 50, rating: 0 },
    { id: "middle", name: "Nama B", rate: 100, rating: 3.5 },
    { id: "high", name: "Nama C", rate: 200, rating: 4.5 },
    { id: "expensive", name: "Nama D", rate: 5000, rating: 5 },
  ].map((l) => ({ ...l, specialty: "Hukum Pidana", experience: 10 }));
  const react = {
    useState: (initial) => {
      const i = cursor++;
      if (!(i in states)) states[i] = initial;
      return [
        states[i],
        (v) => {
          states[i] = v;
        },
      ];
    },
    useEffect: () => {},
    useRef: () => ({ current: null }),
  };
  const jsx = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  };
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync("src/components/public/PublicWebsite.tsx", "utf8"),
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
        "next/navigation": { useSearchParams: () => new URLSearchParams() },
        "next/link": { default: "link" },
        "lucide-react": {},
        "@/store/CoinProvider": { usePublicLawyers: () => lawyers },
        "@/data/publicData": { categories: ["Hukum Pidana"] },
        "@/components/ui/Toast": {},
        "@/components/customer/ConsultationBooking": {},
      })[name],
  });
  function render() {
    cursor = 0;
    return exports.Directory();
  }
  function all(tree, predicate) {
    const result = [];
    function walk(node) {
      if (!node || typeof node !== "object") return;
      if (predicate(node)) result.push(node);
      for (const child of [node.props?.children].flat(Infinity)) walk(child);
    }
    walk(tree);
    return result;
  }
  return {
    render,
    all,
    ids: (tree) =>
      all(tree, (n) => n.type?.name === "LawyerCard").map(
        (n) => n.props.lawyer.id,
      ),
    numbers: (tree) =>
      all(tree, (n) => n.type === "input" && n.props.type === "number"),
    rating: (tree) => all(tree, (n) => n.type === "select")[1],
  };
}
test("default range includes all rates and unrated lawyers", () => {
  const h = harness(),
    tree = h.render();
  assert.deepEqual(h.ids(tree), ["unrated", "middle", "high", "expensive"]);
  assert.equal(h.numbers(tree)[1].props.value, 5000);
});
test("price range filters both endpoints inclusively and combines with rating", () => {
  const h = harness();
  let tree = h.render();
  h.numbers(tree)[0].props.onChange({ target: { value: "100" } });
  tree = h.render();
  h.numbers(tree)[1].props.onChange({ target: { value: "200" } });
  tree = h.render();
  assert.deepEqual(h.ids(tree), ["middle", "high"]);
  h.rating(tree).props.onChange({ target: { value: "4" } });
  assert.deepEqual(h.ids(h.render()), ["high"]);
});
test("rating choices are whole stars one through five", () => {
  const h = harness(),
    tree = h.render();
  assert.deepEqual(
    h.all(h.rating(tree), (n) => n.type === "option").map((n) => n.props.value),
    ["", 1, 2, 3, 4, 5],
  );
});
test("numeric endpoints remain ordered and Reset restores all results", () => {
  const h = harness();
  let tree = h.render();
  h.numbers(tree)[1].props.onChange({ target: { value: "100" } });
  tree = h.render();
  h.numbers(tree)[0].props.onChange({ target: { value: "200" } });
  tree = h.render();
  assert.deepEqual(
    h.numbers(tree).map((n) => n.props.value),
    [200, 200],
  );
  h.all(
    tree,
    (n) => n.type === "button" && n.props.children === "Reset",
  )[0].props.onClick();
  assert.equal(h.ids(h.render()).length, 4);
});
