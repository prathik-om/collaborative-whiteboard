# Collaborative Whiteboard

Free collaborative whiteboard for students and teachers with real-time collaboration, educational templates, and productivity tools.

## Features

- ✅ **Real-time Collaboration** - Multiple users draw simultaneously
- ✅ **No Account Required** - Anonymous access via device ID
- ✅ **Study Groups** - Create collaborative sessions for homework/projects
- 🚧 **Educational Templates** - Brainstorming, mind maps, project planning (coming soon)
- 🚧 **Guided Prompts** - Step-by-step learning workflows (coming soon)
- 🚧 **Productivity Tools** - To-do lists, Pomodoro timer (coming soon)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd collaborative-whiteboard
npm install
```

### 2. Set Up Supabase

Follow the [Supabase Setup Guide](SUPABASE_SETUP.md) to:
- Create a new Supabase project
- Run database migrations
- Configure environment variables

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 4. Create Your First Whiteboard

1. Click "Create Whiteboard"
2. Share the session code with collaborators
3. Draw together in real-time!

## Project Structure

```
collaborative-whiteboard/
├── app/                    # Next.js app directory
│   ├── board/             # Whiteboard canvas page
│   └── page.tsx           # Landing page
├── components/            # React components
│   └── WhiteboardCanvas.tsx
├── hooks/                 # Custom React hooks
│   ├── useBroadcastChannel.ts
│   └── useCreateSession.ts
├── lib/                   # Core utilities
│   └── supabase.ts        # Supabase client
├── types/                 # TypeScript types
│   └── database.types.ts
├── utils/                 # Helper functions
│   └── sessionCode.ts
└── supabase/             # Database migrations
    └── migrations/
```

## Tech Stack

- **Framework:** Next.js 15 + React 18 + TypeScript
- **Canvas:** tldraw (collaborative whiteboard library)
- **Database:** Supabase (PostgreSQL + Realtime)
- **Styling:** Tailwind CSS
- **Hosting:** Vercel

## Development

```bash
# Run dev server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Run tests
npm test
```

## Deployment

See [Supabase Setup Guide](SUPABASE_SETUP.md) for production deployment steps.

## Contributing

This is an educational/portfolio project. Feel free to fork and adapt for your own use!

## License

MIT
