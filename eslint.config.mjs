import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Mobile app is a separate Expo project with its own lint config
    "mobile-app/**",
  ]),
  {
    rules: {
      // Downgrade to warnings — these are code-quality issues, not bugs
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      // Common data-fetching pattern in Next.js — not a blocking issue
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
