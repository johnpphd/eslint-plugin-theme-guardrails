# eslint-plugin-theme-guardrails

ESLint rules enforcing MUI theme compliance -- ban hardcoded colors, fontWeight, and fontFamily.

## What it catches

- **Hardcoded hex colors** (`color: "#ff0000"`) -- use `theme.palette.*` instead
- **Hardcoded fontWeight** (`fontWeight: 700`) -- use `theme.typography.fontWeightBold` etc.
- **Hardcoded fontFamily** (`fontFamily: "Arial"`) -- use `theme.typography.fontFamily`

Files under `/theme/` directories and `themeConfig` files are automatically excluded.

## Install

```bash
npm install eslint-plugin-theme-guardrails --save-dev
```

## Usage (flat config)

```javascript
// eslint.config.mjs
import themeGuardrails from "eslint-plugin-theme-guardrails";

export default [
  themeGuardrails.configs.recommended,
  // ... your other configs
];
```

## Rules

| Rule | Description |
| --- | --- |
| `theme-guardrails/no-hardcoded-styles` | Disallow hardcoded colors, fontWeight numbers, and fontFamily strings |

## License

MIT
