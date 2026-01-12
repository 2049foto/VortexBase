import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type rules
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Code style (formatting, semicolons, etc.)
        'refactor', // Code refactor
        'perf',     // Performance improvement
        'test',     // Tests
        'build',    // Build system
        'ci',       // CI/CD
        'chore',    // Chores (deps, configs)
        'revert',   // Revert commit
        'wip',      // Work in progress
      ],
    ],

    // Scope rules
    'scope-enum': [
      2,
      'always',
      [
        'core',        // Core functionality
        'scanner',     // Scanner service
        'risk',        // Risk engine
        'consolidate', // Consolidation service
        'frame',       // Farcaster Frame
        'ui',          // UI components
        'api',         // API routes
        'db',          // Database
        'auth',        // Authentication
        'config',      // Configuration
        'deps',        // Dependencies
        'tests',       // Tests
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],

    // Subject rules
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-min-length': [2, 'always', 3],
    'subject-max-length': [2, 'always', 72],

    // Body rules
    'body-max-line-length': [2, 'always', 100],

    // Header rules
    'header-max-length': [2, 'always', 100],
  },
};

export default config;
