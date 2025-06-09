# Nginx Docker Compose Setup

This setup uses Nginx as a reverse proxy to eliminate CORS issues between your React frontend and Node.js backend.

## Architecture

- **Nginx**: Reverse proxy running on port 80
- **Frontend**: React app with Vite (internal port 5173)
- **Backend**: Node.js/Express with HTTPS (internal port 5000)
- **Database**: PostgreSQL on port 5432

## Key Benefits

1. **No CORS Issues**: All requests go through the same domain (localhost:80)
2. **Single Entry Point**: Frontend and backend accessible through one URL
3. **Development Friendly**: Hot reload for frontend still works
4. **Production Ready**: Easy to scale and deploy

## URL Structure

When running the setup:

- **Frontend**: `http://localhost/sc/` (serves React app with /sc prefix)
- **Backend root**: `http://localhost/` (serves backend templates)
- **Backend API**: `http://localhost/api/*` (proxied to backend)
- **Socket.IO**: `http://localhost/socket.io/*` (proxied to backend)
- **Auth endpoints**: `http://localhost/login`, `http://localhost/register`, etc.
- **Protected endpoints**: `http://localhost/conversations`, `http://localhost/messages`, etc.

## Route Separation

To avoid conflicts between frontend and backend routes, the frontend is served under the `/sc/` prefix:

**Frontend Routes (React Router):**

- `http://localhost/sc/` - main app (redirects to login or chat based on auth status)
- `http://localhost/sc/login` - login page
- `http://localhost/sc/chat` - chat interface

**Backend Routes:**

- `http://localhost/` - backend root (serves backend templates)
- `http://localhost/login`, `/register`, `/logout` - authentication endpoints
- `http://localhost/conversations`, `/messages`, `/keys` - protected API endpoints
- `http://localhost/socket.io/*` - WebSocket connections
- `http://localhost/api/*` - API endpoints (if using /api prefix)

This separation ensures that:

1. No route conflicts between frontend and backend
2. Backend API endpoints work without interference
3. Frontend SPA routing works correctly under its prefix
4. Both services can coexist on the same domain

## How to Run

1. Make sure Docker and Docker Compose are installed
2. Run the setup:
   ```bash
   docker-compose up --build
   ```
3. Access your application at `http://localhost`

## Development

- Frontend hot reload still works through nginx proxy
- Backend changes require container restart (add nodemon if needed)
- Database data persists in `./db` volume

## Nginx Configuration

The nginx configuration:

- Routes `/` to the React frontend
- Routes `/api/*` to the backend API
- Routes `/socket.io/*` to Socket.IO
- Routes specific endpoints like `/login`, `/register` to backend
- Handles WebSocket upgrades for both Vite HMR and Socket.IO
- Properly forwards cookies and headers for authentication

## Frontend Configuration Updates

Your frontend now uses `/sc/` as the base path to avoid route conflicts:

- All frontend routes are prefixed with `/sc/`
- React Router uses `basename="/sc"`
- Vite config includes `base: '/sc/'`
- API calls remain relative (e.g., `/login`, `/conversations`) - these go to backend
- Socket.IO connection should use: `io('/', {withCredentials: true})`

**Route Separation:**

- Frontend routes: `/sc/login`, `/sc/chat`, `/sc/`
- Backend API routes: `/login`, `/register`, `/conversations`, etc.
- This eliminates conflicts between frontend pages and backend API endpoints

## Backend Configuration Updates

- Backend CORS now allows requests from nginx proxy
- No need to expose backend port directly
- SSL certificates still used for backend security
- Authentication and cookies work through nginx proxy

## Troubleshooting

1. **502 Bad Gateway**: Backend container might not be running or healthy
2. **404 Not Found**: Check nginx routing configuration
3. **CORS Issues**: Verify backend CORS settings include nginx origins
4. **WebSocket Issues**: Ensure nginx properly forwards WebSocket upgrades

## Production Considerations

For production:

1. Add SSL/TLS termination at nginx level
2. Configure proper logging
3. Add rate limiting
4. Set up health checks
5. Use nginx caching for static assets
