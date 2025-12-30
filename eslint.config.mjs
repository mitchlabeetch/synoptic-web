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
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // CommonJS scripts
    "scripts/**",
  ]),
  // Custom rule overrides
  {
    rules: {
      // Allow explicit any in specific scenarios (API routes, external libs)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars that start with underscore
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true
      }],
      // Allow img elements (we use them intentionally in some cases)
      "@next/next/no-img-element": "warn",
      // React hooks - more lenient
      "react-hooks/purity": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Allow empty interfaces (useful for extending types)
      "@typescript-eslint/no-empty-object-type": "warn",
      // Allow namespaces for type declarations
      "@typescript-eslint/no-namespace": "warn",
      // React specific
      "react/no-unescaped-entities": "warn",
    },
  },
]);

export default eslintConfig;
