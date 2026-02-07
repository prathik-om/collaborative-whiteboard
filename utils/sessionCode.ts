// Session code generation utilities

const ADJECTIVES = [
  'happy', 'sunny', 'bright', 'clever', 'swift', 'bold', 'calm', 'cool',
  'wise', 'kind', 'brave', 'gentle', 'quick', 'proud', 'sweet', 'warm',
  'blue', 'red', 'green', 'purple', 'orange', 'yellow', 'pink', 'silver',
];

const ANIMALS = [
  'tiger', 'eagle', 'dolphin', 'panda', 'lion', 'owl', 'fox', 'bear',
  'wolf', 'hawk', 'falcon', 'deer', 'rabbit', 'otter', 'seal', 'whale',
  'penguin', 'koala', 'raccoon', 'squirrel', 'beaver', 'hedgehog',
];

/**
 * Generate a random session code in the format "adjective-animal"
 * e.g., "happy-tiger", "bright-eagle"
 */
export function generateSessionCode(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adjective}-${animal}`;
}

/**
 * Validate session code format
 */
export function isValidSessionCode(code: string): boolean {
  const parts = code.toLowerCase().split('-');
  return (
    parts.length === 2 &&
    ADJECTIVES.includes(parts[0]) &&
    ANIMALS.includes(parts[1])
  );
}
