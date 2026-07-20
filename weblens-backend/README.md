# WebLens Backend

This is the backend for the WebLens platform, built with **NestJS**. It is structured as a monorepo containing both the main REST API and background workers.

## Architecture

- **API (`apps/api`)**: Handles incoming HTTP requests, user authentication (JWT), and manages audit requests.
- **Worker (`apps/worker`)**: A separate NestJS application that consumes tasks from **BullMQ** to process heavy website auditing tasks asynchronously.
- **Packages (`packages/`)**: Shared libraries such as TypeORM entities, audit logic, and tech-detection modules.

## Prerequisites

- Node.js (v18+)
- MySQL
- Redis (required for BullMQ background jobs and Socket.IO adapter)

*Note: You can easily start MySQL and Redis using the `docker-compose.yml` file located in the root of the project.*

## Installation

```bash
npm install
```

## Running the app

To run the REST API:
```bash
# development
npm run start:dev api

# production mode
npm run start:prod api
```

To run the background Worker:
```bash
# development
npm run start:dev worker

# production mode
npm run start:prod worker
```

## Environment Variables
Create a `.env` file in the root of `weblens-backend` containing necessary configurations (Database credentials, Redis host/port, JWT secrets).
