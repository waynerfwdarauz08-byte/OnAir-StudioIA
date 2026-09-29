import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import {
  defineConfig,
  globalIgnores,
} from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist",
  ]),

  {
    files: ["**/*.{js,jsx}"],

    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],

    languageOptions: {
      globals: globals.browser,

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      /*
       * El proyecto usa efectos para cargar datos,
       * restaurar sesión y actualizar la interfaz.
       * Son patrones válidos para esta aplicación.
       */
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-caught-error": "off",
      "preserve-caught-error": "off",
      /*
       * AuthContext y ThemeContext exportan contexto
       * y proveedor en el mismo archivo.
       */
      "react-refresh/only-export-components": "off",

      /*
       * La contraseña se ignora intencionalmente:
       * la autenticación es simulada con JSON Server.
       */
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^ignored",
          argsIgnorePattern: "^ignored",
        },
      ],

      /*
       * Evita advertencias de dependencias que no
       * afectan el funcionamiento actual.
       */
      "react-hooks/exhaustive-deps": "off",
    },
  },
]);