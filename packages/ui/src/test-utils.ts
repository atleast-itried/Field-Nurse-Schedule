import { expect } from 'vitest';
import matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T> {}
  }
} 