# VideoLab

VideoLab is a video review application with a standalone React frontend and a PHP/PDO JSON API. Authenticated users can upload MP4 videos, draw timestamped annotations, and save bookmarks. Administrators can review platform totals, recent videos, and paginated users.

## Requirements

- PHP 8.2+
- MariaDB/MySQL with PDO MySQL enabled
- Node.js and npm
- A modern browser with JavaScript enabled

## Local setup

Create the backend environment file and configure the database and administrator values:

```bash
cp backend/.env.example backend/.env
```

Install the frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

The frontend API address defaults to `http://localhost:8080/api.php`. To change it, copy `frontend/.env.example` to `frontend/.env` and edit `VITE_API_URL`.

Start MariaDB, then launch each application in its own terminal.

Backend terminal:

```bash
cd backend
./run.sh
```

Frontend terminal:

```bash
cd frontend
./run.sh
```

The applications run independently:

- React frontend: `http://localhost:5173`
- PHP backend: `http://localhost:8080/api.php`

Each script starts only its own application. Stopping one server does not stop the other, and PHP never serves or routes the React frontend.

The backend reads `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, and `FRONTEND_URL` from `backend/.env`. The final four-table schema is created on first use. Existing tables are never dropped automatically, and no runtime `ALTER TABLE` migrations run.

## Production deployment

Build and deploy `frontend/` as a static React application. Set `VITE_API_URL` to the public PHP API URL before building. Deploy `backend/` separately behind Apache or Nginx with PHP-FPM, and set `FRONTEND_URL` to the exact public frontend origin so credentialed API requests are allowed.

## Features

- React component-based interface with bundled Lucide SVG icons
- PHP JSON API using controllers, services, and models
- Session authentication across credentialed API requests
- Asynchronous login and registration with inline validation
- MP4 uploads up to 40MB in the frontend and 100MB at the API boundary, with optional JPG, PNG, or WebP thumbnails up to 5MB
- All Videos and My Videos filters, search, and eight-video pagination
- Clean frontend routes such as `/videos`, `/videos/:id`, `/upload`, and `/admin`
- Custom play, pause, pointer, touch, and keyboard seeking
- Freehand annotation creation stored as normalized JSON
- Timestamped annotations and bookmarks with in-place list updates
- Independent three-visible-item annotation and bookmark lists
- Dashboard totals, five latest videos, and paginated users
- Responsive orange-and-cream interface

## Structure

- `backend/api.php` dispatches JSON API requests
- `backend/router.php` limits the PHP development server to backend files and responses
- `backend/run.sh` starts only the PHP development API server
- `backend/.gitignore` contains backend runtime ignore rules
- `backend/controllers/` receives API requests and coordinates responses
- `backend/services/` contains validation and application rules
- `backend/models/` contains prepared PDO queries
- `backend/config/` contains application and final database schema initialization
- `backend/uploads/` contains uploaded media and is ignored by Git
- `frontend/index.html` is the standalone Vite application shell
- `frontend/run.sh` starts only the Vite development server
- `frontend/.gitignore` contains frontend dependency, build, and environment ignore rules
- `frontend/src/` contains React pages, hooks, components, utilities, and styles
- `frontend/public/images/` contains frontend image and SVG assets
- `frontend/dist/` contains generated production frontend assets

## Database schema

The application tables are:

- `users`
- `videos`
- `annotations`
- `bookmarks`

Annotation and bookmark timestamps use `DECIMAL(10,3)`. Foreign keys cascade when a related user or video is deleted. The application creates missing tables directly from the final schema but never performs destructive resets at runtime.
