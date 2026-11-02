import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig(
  [
    ...nextVitals,
    ...nextTs,
    // Override default ignores of eslint-config-next.
    globalIgnores(
      [
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
        // backend/ is a separate package with its own tsc, tests and prettier (tsconfig excludes it too).
        "backend/**",
      ]
    ),
    {
      // The CommonJS test harnesses load sources with require() by design.
      files: ["**/*.cjs"],
      rules: { "@typescript-eslint/no-require-imports": "off" },
    },
  ]
);

export default eslintConfig;
