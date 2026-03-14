import type { ESLint, Linter } from "eslint";
import noHardcodedStyles from "./rules/no-hardcoded-styles.js";

const rules = {
  "no-hardcoded-styles": noHardcodedStyles,
};

const recommendedRules: Linter.RulesRecord = {
  "theme-guardrails/no-hardcoded-styles": "error",
};

const plugin: ESLint.Plugin & {
  configs: Record<string, Linter.Config>;
} = {
  rules,
  configs: {
    recommended: {
      plugins: {
        get "theme-guardrails"() {
          return plugin;
        },
      },
      rules: recommendedRules,
    },
    all: {
      plugins: {
        get "theme-guardrails"() {
          return plugin;
        },
      },
      rules: recommendedRules,
    },
  },
};

export { rules };
export default plugin;
