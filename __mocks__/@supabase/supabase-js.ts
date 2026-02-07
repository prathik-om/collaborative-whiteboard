// Mock implementation of Supabase client for testing
// This mock provides the minimal interface needed for our tests

export const createClient = jest.fn(() => ({
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: null,
          error: null
        })),
      })),
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: null,
          error: null
        })),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({
        data: null,
        error: null
      })),
    })),
  })),
  channel: jest.fn(() => ({
    on: jest.fn(function(this: any) {
      return this;
    }),
    subscribe: jest.fn(),
    send: jest.fn(),
    unsubscribe: jest.fn(),
  })),
}));

export const supabase = createClient();
