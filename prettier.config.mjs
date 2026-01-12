/** @type {import('prettier').Config} */
const config = {
  // Formatting
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,

  // JSX
  jsxSingleQuote: false,
  bracketSameLine: false,

  // Markdown
  proseWrap: 'preserve',

  // End of line
  endOfLine: 'lf',

  // Plugins
  plugins: ['prettier-plugin-tailwindcss'],

  // Tailwind CSS class sorting
  tailwindFunctions: ['cn', 'clsx', 'cva'],
};

export default config;
