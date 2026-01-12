/**
 * Bun test types
 */
declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function mock(fn: (...args: unknown[]) => unknown): (...args: unknown[]) => unknown;
  export function expect<T>(value: T): {
    toBe(expected: T): void;
    toEqual(expected: T): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeInstanceOf(constructor: new (...args: unknown[]) => unknown): void;
    toThrow(): void;
    toThrowError(): void;
    toMatch(regex: RegExp | string): void;
    toContain(item: unknown): void;
    toBeGreaterThan(value: number): void;
    toBeLessThan(value: number): void;
    toBeGreaterThanOrEqual(value: number): void;
    toBeLessThanOrEqual(value: number): void;
    toBeCloseTo(value: number, precision?: number): void;
    rejects: {
      toBe(expected: T): Promise<void>;
      toEqual(expected: T): Promise<void>;
      toThrow(): Promise<void>;
      toThrowError(): Promise<void>;
    };
    not: {
      toBe(expected: T): void;
      toEqual(expected: T): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toBeNull(): void;
      toBeUndefined(): void;
      toBeDefined(): void;
      toBeInstanceOf(constructor: new (...args: unknown[]) => unknown): void;
      toThrow(): void;
      toThrowError(): void;
      toMatch(regex: RegExp | string): void;
      toContain(item: unknown): void;
      toBeGreaterThan(value: number): void;
      toBeLessThan(value: number): void;
      toBeGreaterThanOrEqual(value: number): void;
      toBeLessThanOrEqual(value: number): void;
      toBeCloseTo(value: number, precision?: number): void;
    };
  };
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
}
