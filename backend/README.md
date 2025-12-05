# ABM Approval Backend

Backend server for ABM Approval Hub that connects directly to MySQL database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - The `.env` file is already created with database credentials
   - Update `CORS_ORIGIN` if your frontend runs on a different port

3. Run in development mode:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Requests
- `POST /webhook/requests/fetch-requests` - Fetch approval requests for a user
- `POST /webhook/requests/update-discount-request` - Update a request (approve/reject/modify)

### Reportees
- `POST /webhook/reportees/get-reportees` - Fetch reportees for an ABM user

### Health Check
- `GET /health` - Check if server is running

## Database Configuration

The backend connects to MySQL database using the credentials in `.env` file.

**Important:** Update the SQL queries in the controllers with your actual table names and schema:
- `src/controllers/requestController.ts` - Update table name and field mappings
- `src/controllers/reporteeController.ts` - Update table name and field mappings

## Notes

- The endpoints match the n8n webhook structure for easy migration
- CORS is configured to allow requests from the frontend
- Database connection uses connection pooling for better performance

