# XZoom

XZoom is a browser-based video meeting application with three parts:

- `backend`: Express, MongoDB, Socket.IO, authentication, meetings, chat, and WebRTC signaling.
- `frontend`: the signed-in dashboard and meeting room.
- `landing`: a minimal public page describing the features currently implemented.

## Local setup

Use Node.js 20 or newer. Install each application separately:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Set a real `MONGODB_URI` and a long random `JWT_SECRET` in `backend/.env`. The API and socket server run at `http://localhost:5000`.

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

The meeting application runs at `http://localhost:5173`. The checked-in endpoint switch currently targets the Render backend. To use the local backend, activate the commented local pair in `frontend/src/config/endpoints.js` or provide a `frontend/.env.local` override.

To run the public page:

```powershell
cd landing
npm install
npm start
```

The landing page runs at `http://localhost:3000`.

## Validation

Run the available checks inside each application:

```powershell
npm test
npm run lint
npm run build
npm audit
```

The backend has no lint script; use its tests and Node syntax checks. Camera, microphone, clipboard, and screen-sharing APIs require a secure origin in production.

## Deployment

### Backend on Render

Create the service from `backend/render.yaml` or configure the `backend` folder manually. Set these private Render environment values:

- `MONGODB_URI`: the MongoDB connection string.
- `JWT_SECRET`: a long random value.
- `CORS_ORIGIN`: the final Vercel frontend URL, such as `https://your-project.vercel.app`.

The active frontend configuration targets `https://xzoombackend.onrender.com` for both REST and Socket.IO traffic.

### Frontend on Vercel

Import this GitHub repository and select `frontend` as the Root Directory. Vercel will use `frontend/vercel.json`, run the Vite build, publish `dist`, and route client-side URLs such as `/login` and `/meeting/:id` back to the application.

After the first Vercel deployment, copy its final URL into the Render `CORS_ORIGIN` environment variable and redeploy the backend.
