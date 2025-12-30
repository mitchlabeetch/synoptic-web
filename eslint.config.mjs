import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Filter out react-compiler plugin from configs (Next.js 16 bundles it but it causes false positives)
const filterReactCompiler = (configs) => {
  return configs.map(config => {
    // Skip react-compiler rules
    if (config.plugins && config.plugins['react-compiler']) {
      const { 'react-compiler': _, ...restPlugins } = config.plugins;
      config = { ...config, plugins: restPlugins };
    }
    if (config.rules) {
      const filteredRules = { ...config.rules };
      Object.keys(filteredRules).forEach(key => {
        if (key.startsWith('react-compiler/')) {
          delete filteredRules[key];
        }
      });
      config = { ...config, rules: filteredRules };
    }
    return config;
  });
};

const eslintConfig = defineConfig([
  ...filterReactCompiler(nextVitals),
  ...filterReactCompiler(nextTs),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // CommonJS scripts
    "scripts/**",
    // Generated files
    "src/data/seeds/**",
  ]),
  // Custom rule overrides
  {
    rules: {
      // Disable React Compiler rules entirely (false positives in Next.js 16)
      "react-compiler/react-compiler": "off",
      // Disable no-explicit-any (too many API integrations need it)
      "@typescript-eslint/no-explicit-any": "off",
      // Allow unused vars (too many false positives during rapid development)
      "@typescript-eslint/no-unused-vars": "off",
      // Allow img elements (Next/Image has issues with external URLs)
      "@next/next/no-img-element": "off",
      // React hooks - more lenient
      "react-hooks/purity": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      // Allow empty interfaces (useful for extending types)
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow namespaces for type declarations
      "@typescript-eslint/no-namespace": "off",
      // React specific
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
