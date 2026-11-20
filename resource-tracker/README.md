# Resource Tracker Frontend

## Demo sign-in

The sign-in and registration screens use browser-local demonstration data; they are not a production authentication service. Seeded mock accounts use the password `Demo123!`:

| Role | Email |
| --- | --- |
| Team Lead | `chikondi@example.com` |
| Line Manager | `tamandani@example.com` |
| Department Manager | `grace@example.com` |
| System Administrator | `admin@example.com` |

Use **Create a test account** on the sign-in page to add a browser-local account. Registered account records and password hashes are stored in this browser only. Do not use real credentials or sensitive information. Clearing this browser's site data removes registered demo accounts.

## Team Lead teams and projects preview

The Team Lead sidebar includes Teams and Projects pages, and the request history
also lists the demonstration teams. Team activation changes are stored only in
the current browser; the project list and team catalogue are sample data. These
controls do not update the backend.

The new request form uses demonstration department, team, and project names;
Line Manager choices are loaded from the API. The backend resolves the selected
team and project by name, so they must exist and be assigned to each other.
Department is displayed for selection and team filtering; the API derives it
from the selected team.

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

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
