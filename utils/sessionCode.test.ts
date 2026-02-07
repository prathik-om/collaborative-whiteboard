// Tests for session code generation and validation
import { generateSessionCode, isValidSessionCode } from './sessionCode';

describe('generateSessionCode', () => {
  it('generates code in format "adjective-animal"', () => {
    const code = generateSessionCode();
    expect(code).toMatch(/^[a-z]+-[a-z]+$/);
  });

  it('generates valid session codes', () => {
    const code = generateSessionCode();
    expect(isValidSessionCode(code)).toBe(true);
  });

  it('generates different codes on multiple calls', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateSessionCode());
    }
    // Should have high variety (at least 50 unique in 100 tries)
    // With 24 adjectives × 22 animals = 528 combinations
    expect(codes.size).toBeGreaterThan(50);
  });
});

describe('isValidSessionCode', () => {
  it('validates correct format', () => {
    expect(isValidSessionCode('happy-tiger')).toBe(true);
    expect(isValidSessionCode('bright-eagle')).toBe(true);
    expect(isValidSessionCode('sunny-panda')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidSessionCode('happy')).toBe(false);
    expect(isValidSessionCode('happy-tiger-extra')).toBe(false);
    expect(isValidSessionCode('invalid-animal')).toBe(false);
    expect(isValidSessionCode('happy-notananimal')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(isValidSessionCode('')).toBe(false);
    expect(isValidSessionCode('---')).toBe(false);
    expect(isValidSessionCode('happy-')).toBe(false);
    expect(isValidSessionCode('-tiger')).toBe(false);
    expect(isValidSessionCode('HAPPY-TIGER')).toBe(true); // Case insensitive
  });
});
