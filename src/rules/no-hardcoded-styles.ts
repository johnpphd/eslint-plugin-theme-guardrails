import type { Rule } from "eslint";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$/;
const COLOR_KEY_REGEX = /color/i;

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow hardcoded colors, fontWeight numbers, and fontFamily strings",
    },
    messages: {
      noHardcodedColor:
        "Use theme palette (e.g., 'text.primary') instead of hardcoded color '{{ value }}'. Reference theme.palette.* or use palette shorthand in sx prop.",
      noHardcodedFontWeight:
        "Use theme typography variants instead of hardcoded fontWeight. Reference theme.typography.fontWeightBold etc.",
      noHardcodedFontFamily:
        "Use theme typography instead of hardcoded fontFamily. Reference theme.typography.fontFamily.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename;

    // Exclude theme config files
    if (/\/theme\//.test(filename) || /themeConfig/.test(filename)) {
      return {};
    }

    return {
      Property(node) {
        // Get key name
        const key =
          node.key.type === "Identifier"
            ? node.key.name
            : node.key.type === "Literal"
              ? String(node.key.value)
              : null;

        if (!key) return;

        const value = node.value;

        // fontWeight: <number>
        if (
          key === "fontWeight" &&
          value.type === "Literal" &&
          typeof value.value === "number"
        ) {
          context.report({ node: value, messageId: "noHardcodedFontWeight" });
          return;
        }

        // fontFamily: "..."
        if (
          key === "fontFamily" &&
          value.type === "Literal" &&
          typeof value.value === "string"
        ) {
          context.report({ node: value, messageId: "noHardcodedFontFamily" });
          return;
        }

        // Color-related key with hex value
        if (
          COLOR_KEY_REGEX.test(key) &&
          value.type === "Literal" &&
          typeof value.value === "string" &&
          HEX_COLOR_REGEX.test(value.value)
        ) {
          context.report({
            node: value,
            messageId: "noHardcodedColor",
            data: { value: value.value },
          });
          return;
        }

        // Any property with a hex color string value
        if (
          value.type === "Literal" &&
          typeof value.value === "string" &&
          HEX_COLOR_REGEX.test(value.value)
        ) {
          context.report({
            node: value,
            messageId: "noHardcodedColor",
            data: { value: value.value },
          });
        }
      },
    };
  },
};

export default rule;
