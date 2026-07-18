![code along](public/readme-header.png)

Web-based single file real-time collaborative code editor. Create a room, share the link, and code together instantly — no sign-up required. Perfect for pair programming, technical interviews, and tutoring sessions.

[https://codealong.live](https://codealong.live)

## Architecture

![Architecture](public/architecture.png)

The architecture is fairly simple. The entire application is built with the [Next.js](https://nextjs.org/) framework and deployed on Vercel. Real-time collaboration is handled by [Yjs](https://yjs.dev/), with [y-supabase](https://github.com/supabase-community/y-supabase) as the sync provider, syncing document state through Supabase's realtime infrastructure.

Code execution is proxied through a Next.js API route that calls the [Runlet](https://github.com/GiridharRNair/Runlet) code execution API. The application previously used [JDoodle](https://www.jdoodle.com/) for code execution, but it was replaced with Runlet, partly to learn how to build a code execution service myself, and partly to avoid the limitations of JDoodle's API.

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Supabase](https://supabase.com/) project

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
```

1. Install dependencies and run the frontend development server:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## License

[MIT](LICENSE)

Open to contributions and feature suggestions via issues or pull requests.
