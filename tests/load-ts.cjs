const fs = require("node:fs");

const path = require("node:path");

const vm = require("node:vm");

const ts = require("typescript");

const cache = new Map();

function loadTS(file) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute);
  const exports = {};
  cache.set(absolute, exports);
  const source = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  function resolve(name) {
    if (name.startsWith("@/")) return loadTS("src/" + name.slice(2) + ".ts");
    if (name.startsWith("."))
      return loadTS(path.resolve(path.dirname(absolute), name) + ".ts");

    return require(name);
  }
  vm.runInNewContext(source, {
    exports,
    require: resolve,
    console,
    Date,
    Error,
  });

  return exports;
}

module.exports = {
  loadTS,
};
