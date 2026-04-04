import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended (type-aware rules disabled — faster, no tsconfig needed)
  ...tseslint.configs.recommended,

  // React Hooks
  {
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  // Next.js
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  // Project-specific tweaks — keep it relaxed, catch real bugs only
  {
    rules: {
      // Allow unused vars prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Relax rules that are too noisy for existing codebase
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-console": "off",
      "prefer-const": "warn",
    },
  },

  // Ignore build artifacts and generated files
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/sw.js",
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
    ],
  }
);
