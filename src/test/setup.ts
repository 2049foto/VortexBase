/**
 * Vitest Setup File
 * Global test configuration and mocks
 */

import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// ============================================
// ENVIRONMENT MOCKS
// ============================================

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_APP_NAME', 'Vortex Protocol');
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://vortexbase.vercel.app');
vi.stubEnv('NEXT_PUBLIC_CHAIN_ID', '8453');
vi.stubEnv('NEXT_PUBLIC_ADMIN_WALLET', '0xAdFB2776EB40e5218784386aa576ca9E08450127');

// ============================================
// BROWSER API MOCKS
// ============================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  callback: IntersectionObserverCallback;
  root = null;
  rootMargin = '';
  thresholds = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}
window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// ============================================
// CRYPTO MOCKS
// ============================================

// Mock crypto.randomUUID
Object.defineProperty(crypto, 'randomUUID', {
  value: vi.fn().mockReturnValue('test-uuid-1234-5678-9abc-def012345678'),
});

// ============================================
// FETCH MOCKS
// ============================================

// Global fetch mock (reset in afterEach)
const originalFetch = global.fetch;

beforeAll(() => {
  // Setup before all tests
});

afterEach(() => {
  // Cleanup after each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Restore original fetch
  global.fetch = originalFetch;
});

// ============================================
// CUSTOM MATCHERS
// ============================================

// Add custom matchers if needed
expect.extend({
  toBeValidAddress(received: string) {
    const pass = /^0x[a-fA-F0-9]{40}$/.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid Ethereum address`
          : `expected ${received} to be a valid Ethereum address`,
    };
  },
});

// ============================================
// TYPE EXTENSIONS
// ============================================

declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeValidAddress(): T;
  }
  interface AsymmetricMatchersContaining {
    toBeValidAddress(): unknown;
  }
}
