# Code Along

![code along](public/readme-header.png)

Simple single file real-time collaborative code editor. Create a room, share the link, and code together instantly — no sign-up required. Perfect for pair programming, technical interviews, and tutoring sessions.

## Architecture

![Architecture](public/architecture.png)

The frontend uses the React framework with Typescript powered by Vite. Real-time collaboration is handled by [Yjs](https://yjs.dev/) with [y-supabase](https://github.com/supabase-community/y-supabase) as the sync provider, syncing document state through Supabase's realtime infrastructure. Code execution is proxied through a FastAPI backend that calls the [JDoodle](https://www.jdoodle.com/) compiler API. Both the frontend and backend are deployed on Vercel, with the backend running as a serverless function.

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Python](https://python.org/) 3.13+
- [uv](https://docs.astral.sh/uv/)
- [Supabase](https://supabase.com/) project
- [JDoodle](https://www.jdoodle.com/) API credentials

### Environment Variables

```env
JDOODLE_CLIENT_ID=your_client_id
JDOODLE_CLIENT_SECRET=your_client_secret
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### Frontend

```bash
npm install # Will also install the Python dependencies
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Backend

```bash
npm run api
```

The API will be available at `http://localhost:8000`. Swagger docs are at `http://localhost:8000/api/docs`.

### Other Scripts

```bash
npm run build          # Frontend production build
npm run lint           # Lint TypeScript
npm run format         # Format TypeScript
npm run lint-api       # Lint Python
npm run format-api     # Format Python
```

## License

[MIT](LICENSE)

Open to contributions and feature suggestions via issues or pull requests.

## TODO

The toast that appears when the language is changed should include the name of the user who changed the language.

Create a sandboxed environment for code execution instead of relying on a third-party API.
