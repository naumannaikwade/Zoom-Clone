# XZoom meeting application

Vite and React application for account access, meeting creation/history, and video meeting rooms.

1. Run `npm install`.
2. Optionally copy `.env.example` to `.env.local`.
3. Run `npm run dev` and open `http://localhost:5173`.

Use `npm test`, `npm run lint`, and `npm run build` before deployment. Configure the production REST API and Socket.IO addresses with `VITE_API_BASE_URL` and `VITE_SOCKET_URL`. A TURN relay can be supplied with the optional TURN variables in `.env.example`.
