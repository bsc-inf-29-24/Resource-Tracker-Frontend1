# Resource Tracker Frontend

## Sign-in

Sign-in uses the backend `POST /api/v1/auth` endpoint. The frontend does not
seed demo accounts; use an account provisioned in the backend.

## Team Lead teams and projects

The Team Lead Teams and Projects pages load records from the backend API. The
new resource request form loads Line Manager choices from the API and accepts
team and project names that the backend validates when the request is submitted.

## Start the backend

The Vite development server forwards `/api` and `/resource-requests` calls to
`http://localhost:3000`. If the backend is stopped, requests such as sign-in
will fail with a Vite `http proxy error` and `ECONNREFUSED`.

Start Docker Engine, then run the backend from the deployment directory before
starting the frontend:

```powershell
cd ..\Resource-Tracker-production
docker compose up -d
docker compose ps
```

Confirm the `app` service is running and exposing port `3000`. Then, in a
separate terminal, start the frontend:

```powershell
cd ..\resource-tracker
npm run dev
```

If the backend is already running, verify that `http://localhost:3000` is
reachable. Do not change the Vite proxy target to resolve `ECONNREFUSED` when
the backend service is stopped.

The Vite development server proxies API calls to the local backend, so leave
`VITE_API_BASE_URL` unset during local development. For deployment, serve the
frontend and API on the same origin with a reverse proxy forwarding `/api` and
`/resource-requests` to the backend. The currently packaged backend does not
allow cross-origin browser requests by default. Set `VITE_API_BASE_URL` to an
API origin only for deployments where backend CORS is configured; otherwise,
leave it unset and route the API through the same-origin reverse proxy.

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
