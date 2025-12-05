# Backend Setup Summary

## ✅ Completed

1. **Backend Structure Created**
   - `/backend` directory with full TypeScript/Express setup
   - Database connection configuration
   - API routes matching n8n webhook endpoints
   - Controllers for requests, reportees, and authentication

2. **Database Configuration**
   - MySQL connection pool configured
   - Credentials stored in `.env` file
   - Connection testing on startup

3. **Frontend Integration**
   - Updated `Dashboard.tsx` to use configurable API base URL
   - Updated `useActionHandler.ts` to use configurable API base URL
   - Updated `Login.tsx` to use configurable API base URL
   - Can switch between n8n and local backend via `VITE_API_BASE_URL` env variable

4. **Security**
   - `.env` file added to `.gitignore`
   - `.env.example` created as template

5. **Dependencies Installed**
   - All backend npm packages installed successfully

## ⚠️ Action Required

### 1. Update SQL Queries with Actual Table Names

The following files contain placeholder table names that need to be updated:

**`backend/src/controllers/requestController.ts`**
- Line ~20: Change `campaign.DiscountRequest` to your actual requests table name
- Verify all field names match your database schema
- Add any missing fields (status, adminStatus, adminRemarks, adminDiscountValue, adminDiscountType)

**`backend/src/controllers/reporteeController.ts`**
- Line ~20: Change `campaign.Reportees` to your actual reportees table name
- Verify field names match your schema

**`backend/src/controllers/authController.ts`**
- Line ~20: Change `campaign.ABMUsers` to your actual users table name
- Verify username field name

### 2. Provide Database Schema

Please provide the schema for:
- **Requests table** - The table storing approval requests with all fields
- **Reportees table** - The table storing SE users and ABM relationships  
- **Users table** - The table for ABM user authentication

### 3. Test the Backend

```bash
cd backend
npm run dev
```

The server should start on port 3001. Check console for:
- ✅ Database connected successfully
- 🚀 Backend server running on port 3001

### 4. Test Frontend Connection

Create `.env` in root directory:
```env
VITE_API_BASE_URL=http://localhost:3001
```

Then run frontend:
```bash
npm run dev
```

## 📁 File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # MySQL connection
│   ├── routes/
│   │   ├── requests.ts          # Request endpoints
│   │   ├── reportees.ts          # Reportee endpoints
│   │   └── auth.ts               # Authentication endpoints
│   ├── controllers/
│   │   ├── requestController.ts  # Request logic (NEEDS TABLE NAMES)
│   │   ├── reporteeController.ts # Reportee logic (NEEDS TABLE NAMES)
│   │   └── authController.ts    # Auth logic (NEEDS TABLE NAMES)
│   └── server.ts                 # Main server file
├── .env                          # Database credentials (DO NOT COMMIT)
├── package.json
├── tsconfig.json
└── README.md
```

## 🔄 Switching Between n8n and Backend

**Use n8n (default):**
- Don't set `VITE_API_BASE_URL` or set it to n8n URL
- Frontend will use: `https://ninjasndanalytics.app.n8n.cloud`

**Use local backend:**
- Set `VITE_API_BASE_URL=http://localhost:3001` in root `.env`
- Frontend will use: `http://localhost:3001`

## 📝 Next Steps

1. Share your database table schemas
2. Update SQL queries in controllers with actual table/field names
3. Test database connection
4. Test API endpoints
5. Deploy backend to production server

## 🐛 Troubleshooting

**Database connection fails:**
- Verify credentials in `backend/.env`
- Check network access to `nbs.ninjacart.in:6033`
- Verify database name is correct

**API calls fail:**
- Check backend is running on port 3001
- Verify CORS settings in `backend/src/server.ts`
- Check browser console for CORS errors

**Table not found errors:**
- Update table names in controllers
- Verify table exists in `campaign` database
- Check field names match your schema

