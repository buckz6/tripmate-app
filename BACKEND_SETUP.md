# Express Server Setup - TripMate Backend

## Server Status ✅
The Express server is successfully running on **port 5000** with all required middleware and routes configured.

## Middleware Stack
- **Helmet**: Security headers protection
- **CORS**: Cross-Origin Resource Sharing configured for `http://localhost:3000`
- **Express.json()**: JSON body parser (10kb limit)
- **Morgan**: HTTP request logging
- **Rate Limiting**: 
  - Auth endpoints: 20 requests per 15 minutes
  - AI endpoints: 10 requests per minute

## Routes
### Public Routes
- `GET /api/health` - Health check endpoint
- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/login` - User login with JWT token generation

### Protected Routes
- `GET /api/profile` - Get authenticated user profile (requires Authorization header)
- `POST /api/ai/*` - AI endpoints (requires valid JWT token)

## Authentication Flow
1. User registers with: name, email, password (min 8 chars, 1 uppercase, 1 number)
2. Backend hashes password with bcrypt (salt rounds: 12)
3. User logs in with email and password
4. Backend returns JWT token (7-day expiration)
5. Frontend stores token in localStorage as `tripmate_token`
6. Frontend includes token in Authorization header for protected routes

## Environment Configuration
- **PORT**: 5000
- **NODE_ENV**: development
- **DB**: MySQL on localhost:3306 (database: tripmate)
- **JWT_SECRET**: Generated 64-char hex string
- **ALLOWED_ORIGIN**: http://localhost:3000 (frontend URL)
- **GEMINI_API_KEY**: Configured for AI features

## Error Handling
- Global error handler catches all unhandled errors
- 404 handler for unmapped routes
- Input validation on all auth endpoints
- Proper HTTP status codes (400, 401, 409, 500)

## Testing the Backend
```bash
# Check server health
curl http://localhost:5000/api/health

# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123"}'

# Get profile (replace TOKEN with JWT from login)
curl http://localhost:5000/api/profile \
  -H "Authorization: Bearer TOKEN"
```

## Frontend Integration
The frontend (`http://localhost:3000`) can now:
- Register new accounts
- Login and receive JWT token
- Access protected pages with token
- All API calls go to `http://localhost:5000/api/*`

## Next Steps
1. Verify database schema is created (users and journals tables)
2. Test auth endpoints with frontend
3. Implement remaining API endpoints:
   - Journal CRUD operations
   - Explore/Destinations endpoints
   - Booking endpoints
   - AI Trip Planner endpoints
4. Add more validation and error handling as needed
