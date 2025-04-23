import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import './test-utils';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
}); 