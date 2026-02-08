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
 * Generate a random session code in the format "adjective-animal-number"
 * e.g., "happy-tiger-42", "bright-eagle-17"
 *
 * Total combinations: 24 adjectives × 22 animals × 100 numbers = 52,800
 */
export function generateSessionCode(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const number = Math.floor(Math.random() * 100); // 0-99
  return `${adjective}-${animal}-${number}`;
}

/**
 * Validate session code format
 * Accepts: "adjective-animal-number" (e.g., "happy-tiger-42")
 */
export function isValidSessionCode(code: string): boolean {
  const parts = code.toLowerCase().split('-');

  // Must have exactly 3 parts
  if (parts.length !== 3) return false;

  // Validate adjective and animal
  const [adjective, animal, numberStr] = parts;
  if (!ADJECTIVES.includes(adjective) || !ANIMALS.includes(animal)) {
    return false;
  }

  // Validate number (0-99)
  const number = parseInt(numberStr, 10);
  return !isNaN(number) && number >= 0 && number < 100;
}
