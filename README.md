# WebLens

WebLens is an AI-driven website audit platform. It leverages a Next.js frontend and a NestJS backend, utilizing asynchronous background processing via BullMQ for heavy audit tasks.

## Project Structure

- `weblens-backend/`: NestJS backend containing both the API server and the background workers.
- `weblens-frontend/`: Next.js frontend built with React, Tailwind CSS, and Redux Toolkit with RTK Query.
- `docker-compose.yml`: Infrastructure definition for local development (MySQL, Redis).
- `reports/`: Directory for storing generated website audit reports and related assets.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- Docker & Docker Compose
- Git

### 1. Start Infrastructure

Start the MySQL and Redis containers using Docker Compose:

```bash
docker-compose up -d
```

### 2. Backend Setup

Navigate to the backend directory, install dependencies, and start the development server:

```bash
cd weblens-backend
npm install
npm run start:dev
```

### 3. Frontend Setup

Navigate to the frontend directory, install dependencies, and start the Next.js development server:

```bash
cd weblens-frontend
npm install
npm run dev
```

## Architecture Notes

- **Asynchronous Audits:** The platform offloads website auditing tasks to BullMQ. The API acknowledges the request and returns a job ID.
- **Real-time Updates:** Socket.IO is used to emit progress events from the backend worker to the frontend client.
- **Data Management:** Redux Toolkit and RTK Query handle state and data fetching on the frontend, while TypeORM and MySQL manage backend data.
