# Velion DKN - Backend API

Node.js/Express backend for the Digital Knowledge Network system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure your `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=velion_dkn
DB_PORT=3306

PORT=5000
NODE_ENV=development

JWT_SECRET=your_secret_key

UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

4. Create and setup database:
```sql
CREATE DATABASE velion_dkn;
```

Then import schema:
```bash
mysql -u root -p velion_dkn < database/schema.sql
```

5. Run the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Required
Most endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/profile` - Get profile (protected)

#### Documents
- `POST /documents/upload` - Upload document (protected, multipart/form-data)
- `GET /documents` - List documents with filters (protected)
- `GET /documents/recent?limit=10` - Recent documents (protected)
- `GET /documents/:id` - Document details (protected)
- `GET /documents/:id/download` - Download file (protected)
- `DELETE /documents/:id` - Delete document (protected, owner only)

#### Users
- `GET /users/leaderboard?limit=10` - Top contributors (protected)
- `GET /users/experts` - Expert directory (protected)
- `GET /users/stats/:id?` - User statistics (protected)
- `GET /users/departments` - All departments (protected)
- `GET /users/regions` - All regions (protected)

## File Upload

Supported file types:
- PDF (.pdf)
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- PowerPoint (.ppt, .pptx)
- Text (.txt)
- CSV (.csv)

Max file size: 10MB (configurable in .env)

## Error Handling

All errors return JSON with format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- File upload validation
- SQL injection protection
- CORS enabled

## Database

MySQL with 3 tables:
- `users` - User accounts
- `documents` - Document metadata
- `downloads` - Download tracking
