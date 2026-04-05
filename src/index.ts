import type { ESLint, Linter } from "eslint";
import noHardcodedStyles from "./rules/no-hardcoded-styles.js";

const rules = {
  "no-hardcoded-styles": noHardcodedStyles,
};

const recommendedRules: Linter.RulesRecord = {
  "theme-guardrails/no-hardcoded-styles": "error",
};

function makeFrameworkRules(framework: "mui" | "tailwind"): Linter.RulesRecord {
  return {
    "theme-guardrails/no-hardcoded-styles": ["error", { framework }],
  };
}

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
    mui: {
      plugins: {
        get "theme-guardrails"() {
          return plugin;
        },
      },
      rules: makeFrameworkRules("mui"),
    },
    tailwind: {
      plugins: {
        get "theme-guardrails"() {
          return plugin;
        },
      },
      rules: makeFrameworkRules("tailwind"),
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
