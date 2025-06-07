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

- **Frontend**: `http://localhost/` (serves React app)
- **Backend API**: `http://localhost/api/*` (proxied to backend)
- **Socket.IO**: `http://localhost/socket.io/*` (proxied to backend)
- **Auth endpoints**: `http://localhost/login`, `http://localhost/register`, etc.
- **Protected endpoints**: `http://localhost/conversations`, `http://localhost/messages`, etc.

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

Your frontend should now make API calls to relative paths:

- Instead of `https://localhost:5000/login` use `/login`
- Instead of `https://localhost:5000/api/conversations` use `/conversations`
- Socket.IO connection should use: `io('/', {withCredentials: true})`

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
