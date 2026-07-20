# WebLens Frontend

This is the frontend application for WebLens, built with **Next.js** (App Router), **React**, and **Tailwind CSS**.

## State Management & Data Fetching
- **Redux Toolkit**: Manages global application state.
- **RTK Query**: Handles all server state management, API data fetching, and background refetching.

## Real-time Communication
- Uses **Socket.IO** client to connect with the backend and receive real-time progress updates for running audits.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables
Ensure you have a `.env.local` file configured to point to your NestJS backend API and WebSocket endpoints.
