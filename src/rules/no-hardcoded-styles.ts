import type { Rule } from "eslint";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$/;
const HEX_COLOR_SUBSTRING_REGEX = /#[0-9a-fA-F]{3,8}/;
const FUNCTIONAL_COLOR_REGEX = /(?:rgba?|hsla?)\([^)]*\)/;

const NAMED_CSS_COLORS = new Set([
  "aliceblue",
  "antiquewhite",
  "aqua",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "black",
  "blanchedalmond",
  "blue",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgreen",
  "darkgrey",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategray",
  "darkslategrey",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dimgrey",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "gray",
  "green",
  "greenyellow",
  "grey",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgreen",
  "lightgrey",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategray",
  "lightslategrey",
  "lightsteelblue",
  "lightyellow",
  "lime",
  "limegreen",
  "linen",
  "magenta",
  "maroon",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "navy",
  "oldlace",
  "olive",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "purple",
  "rebeccapurple",
  "red",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "silver",
  "skyblue",
  "slateblue",
  "slategray",
  "slategrey",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "turquoise",
  "violet",
  "wheat",
  "white",
  "whitesmoke",
  "yellow",
  "yellowgreen",
]);

const BORDER_PROPERTIES = new Set([
  "border",
  "borderTop",
  "borderBottom",
  "borderLeft",
  "borderRight",
  "borderColor",
  "borderTopColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderRightColor",
  "outline",
  "outlineColor",
]);

/**
 * Checks a string value for any hardcoded color. Returns the matched
 * color string on the first hit, or null if nothing was found.
 */
function containsHardcodedColor(value: string): string | null {
  // Full-string hex match
  if (HEX_COLOR_REGEX.test(value)) return value;

  // Hex color embedded in a compound value
  const hexSub = HEX_COLOR_SUBSTRING_REGEX.exec(value);
  if (hexSub) return hexSub[0];

  // Functional color notation (rgb, rgba, hsl, hsla)
  const fnMatch = FUNCTIONAL_COLOR_REGEX.exec(value);
  if (fnMatch) return fnMatch[0];

  // Named CSS color (case-insensitive, full-word match)
  const lower = value.toLowerCase();
  // For compound values, check each word
  const words = lower.split(/[\s,/]+/);
  for (const word of words) {
    if (NAMED_CSS_COLORS.has(word)) return word;
  }

  return null;
}

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

const TW_ARBITRARY_CHECKS: ReadonlyArray<{
  regex: RegExp;
  messageId: string;
}> = [
  { regex: TW_ARBITRARY_HEX_REGEX, messageId: "noTailwindArbitraryColor" },
  { regex: TW_ARBITRARY_RGB_REGEX, messageId: "noTailwindArbitraryColor" },
  {
    regex: TW_ARBITRARY_FONT_WEIGHT_REGEX,
    messageId: "noTailwindArbitraryFontWeight",
  },
  {
    regex: TW_ARBITRARY_FONT_FAMILY_REGEX,
    messageId: "noTailwindArbitraryFontFamily",
  },
];

function checkTailwindString(
  context: Rule.RuleContext,
  node: AnyNode,
  value: string,
) {
  for (const { regex, messageId } of TW_ARBITRARY_CHECKS) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(value)) !== null) {
      context.report({ node, messageId, data: { value: match[0] } });
    }
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
      noHardcodedBorderNone:
        "Use theme tokens instead of hardcoded 'none' on '{{ property }}'. Reference theme spacing/border utilities.",
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
    if ((muiEnabled && isMuiConfig) || (tailwindEnabled && isTailwindConfig))
      return {};

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

        // Border properties: flag 'none' and embedded colors
        if (
          BORDER_PROPERTIES.has(key) &&
          value.type === "Literal" &&
          typeof value.value === "string"
        ) {
          if (value.value.toLowerCase() === "none") {
            context.report({
              node: value,
              messageId: "noHardcodedBorderNone",
              data: { property: key },
            });
            return;
          }
          const borderColor = containsHardcodedColor(value.value);
          if (borderColor) {
            context.report({
              node: value,
              messageId: "noHardcodedColor",
              data: { value: borderColor },
            });
          }
          return;
        }

        // Any string Literal value: check for hardcoded colors
        if (value.type === "Literal" && typeof value.value === "string") {
          const colorMatch = containsHardcodedColor(value.value);
          if (colorMatch) {
            context.report({
              node: value,
              messageId: "noHardcodedColor",
              data: { value: colorMatch },
            });
          }
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
