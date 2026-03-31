import type { Rule } from "eslint";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$/;
const COLOR_KEY_REGEX = /color/i;

// Tailwind arbitrary value patterns
const TW_ARBITRARY_HEX_REGEX = /[\w-]+-\[#[0-9a-fA-F]{3,8}\]/g;
const TW_ARBITRARY_RGB_REGEX = /[\w-]+-\[(?:rgba?|hsla?)\([^\]]+\)\]/g;
const TW_ARBITRARY_FONT_WEIGHT_REGEX = /font-\[\d+\]/g;
const TW_ARBITRARY_FONT_FAMILY_REGEX = /font-\[[^\d\]"][^\]]*\]/g;

type Framework = "mui" | "tailwind" | "both";

const CLASSNAME_HELPERS = new Set([
  "cn",
  "cx",
  "clsx",
  "classNames",
  "classnames",
  "twMerge",
  "twJoin",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = any;

function checkTailwindString(
  context: Rule.RuleContext,
  node: AnyNode,
  value: string,
) {
  for (const regex of [TW_ARBITRARY_HEX_REGEX, TW_ARBITRARY_RGB_REGEX]) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(value)) !== null) {
      context.report({
        node,
        messageId: "noTailwindArbitraryColor",
        data: { value: match[0] },
      });
    }
  }

  TW_ARBITRARY_FONT_WEIGHT_REGEX.lastIndex = 0;
  let fwMatch;
  while ((fwMatch = TW_ARBITRARY_FONT_WEIGHT_REGEX.exec(value)) !== null) {
    context.report({
      node,
      messageId: "noTailwindArbitraryFontWeight",
      data: { value: fwMatch[0] },
    });
  }

  TW_ARBITRARY_FONT_FAMILY_REGEX.lastIndex = 0;
  let ffMatch;
  while ((ffMatch = TW_ARBITRARY_FONT_FAMILY_REGEX.exec(value)) !== null) {
    context.report({
      node,
      messageId: "noTailwindArbitraryFontFamily",
      data: { value: ffMatch[0] },
    });
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow hardcoded colors, fontWeight numbers, and fontFamily strings in MUI theme properties and Tailwind arbitrary values",
    },
    messages: {
      noHardcodedColor:
        "Use theme palette (e.g., 'text.primary') instead of hardcoded color '{{ value }}'. Reference theme.palette.* or use palette shorthand in sx prop.",
      noHardcodedFontWeight:
        "Use theme typography variants instead of hardcoded fontWeight. Reference theme.typography.fontWeightBold etc.",
      noHardcodedFontFamily:
        "Use theme typography instead of hardcoded fontFamily. Reference theme.typography.fontFamily.",
      noTailwindArbitraryColor:
        "Use a Tailwind theme color (e.g., 'bg-primary') instead of arbitrary color '{{ value }}'. Define custom colors in your Tailwind config.",
      noTailwindArbitraryFontWeight:
        "Use a Tailwind font-weight utility (e.g., 'font-bold') instead of arbitrary '{{ value }}'. Define custom weights in your Tailwind config.",
      noTailwindArbitraryFontFamily:
        "Use a Tailwind font-family utility (e.g., 'font-sans') instead of arbitrary '{{ value }}'. Define custom font families in your Tailwind config.",
    },
    schema: [
      {
        type: "object",
        properties: {
          framework: {
            enum: ["mui", "tailwind", "both"],
            default: "both",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const filename = context.filename;
    const options = (context.options[0] as { framework?: Framework }) ?? {};
    const framework: Framework = options.framework ?? "both";

    const muiEnabled = framework === "mui" || framework === "both";
    const tailwindEnabled = framework === "tailwind" || framework === "both";

    const isMuiConfig =
      /\/theme\//.test(filename) || /themeConfig/.test(filename);
    const isTailwindConfig = /tailwind\.config/.test(filename);

    // Skip files that are config for the enabled framework(s)
    if (muiEnabled && isMuiConfig && !tailwindEnabled) return {};
    if (tailwindEnabled && isTailwindConfig && !muiEnabled) return {};
    if (isMuiConfig && isTailwindConfig) return {};

    const visitors: Rule.RuleListener = {};

    // MUI: detect hardcoded values in JS object properties
    if (muiEnabled && !isMuiConfig) {
      visitors.Property = function (node) {
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
          context.report({
            node: value,
            messageId: "noHardcodedFontWeight",
          });
          return;
        }

        // fontFamily: "..."
        if (
          key === "fontFamily" &&
          value.type === "Literal" &&
          typeof value.value === "string"
        ) {
          context.report({
            node: value,
            messageId: "noHardcodedFontFamily",
          });
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
      };
    }

    // Tailwind: detect arbitrary values in className strings
    // JSX node types aren't in @types/eslint, so we use the string-keyed
    // visitor form which ESLint supports at runtime when a JSX parser is active.
    if (tailwindEnabled && !isTailwindConfig) {
      visitors.JSXAttribute = function (node: AnyNode) {
        const name = node.name;
        if (
          !name ||
          name.type !== "JSXIdentifier" ||
          (name.name !== "className" && name.name !== "class")
        ) {
          return;
        }

        const attrValue = node.value;

        // className="literal string"
        if (
          attrValue &&
          attrValue.type === "Literal" &&
          typeof attrValue.value === "string"
        ) {
          checkTailwindString(context, attrValue, attrValue.value);
        }

        if (attrValue && attrValue.type === "JSXExpressionContainer") {
          const expr = attrValue.expression;

          // className={`template`}
          if (expr.type === "TemplateLiteral") {
            for (const quasi of expr.quasis) {
              checkTailwindString(context, quasi, quasi.value.raw);
            }
          }

          // className={"string"}
          if (expr.type === "Literal" && typeof expr.value === "string") {
            checkTailwindString(context, expr, expr.value);
          }
        }
      };

      // Check string arguments in cn(), clsx(), etc.
      visitors.CallExpression = function (node) {
        const callee = node.callee;
        if (
          callee.type !== "Identifier" ||
          !CLASSNAME_HELPERS.has(callee.name)
        ) {
          return;
        }

        for (const arg of node.arguments) {
          if (arg.type === "Literal" && typeof arg.value === "string") {
            checkTailwindString(context, arg as AnyNode, arg.value);
          }

          if (arg.type === "TemplateLiteral") {
            for (const quasi of arg.quasis) {
              checkTailwindString(context, quasi as AnyNode, quasi.value.raw);
            }
          }
        }
      };
    }

    return visitors;
  },
};

export default rule;
