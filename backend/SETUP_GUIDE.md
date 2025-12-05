# Backend Setup Guide

## ✅ What's Been Set Up

1. **Backend Structure**: Complete Node.js/Express backend with TypeScript
2. **Database Connection**: MySQL connection pool configured with your credentials
3. **API Routes**: All endpoints matching n8n webhook structure
4. **Frontend Integration**: Frontend updated to use configurable API base URL
5. **Security**: `.env` file added to `.gitignore`

## 📋 Next Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Update SQL Queries with Actual Table Names

The controllers currently use placeholder table names. You need to update them with your actual database schema:

#### Files to Update:

**`src/controllers/requestController.ts`**
- Update `campaign.DiscountRequest` with your actual requests table name
- Verify all field names match your schema
- Add any missing fields (status, adminStatus, adminRemarks, etc.)

**`src/controllers/reporteeController.ts`**
- Update `campaign.Reportees` with your actual reportees/users table name
- Verify field names match your schema

**`src/controllers/authController.ts`**
- Update `campaign.ABMUsers` with your actual users table name
- Verify the username field name

### 3. Test Database Connection

```bash
npm run dev
```

Check the console for:
- ✅ Database connected successfully
- 🚀 Backend server running on port 3001

### 4. Configure Frontend to Use Backend

Create a `.env` file in the root directory (not in backend folder):

```env
VITE_API_BASE_URL=http://localhost:3001
```

Or keep using n8n by leaving it unset (defaults to n8n URL).

### 5. Run Both Frontend and Backend

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 🔍 Database Schema Needed

To complete the setup, please provide:

1. **Requests Table Schema** - The table that stores approval requests
   - Table name
   - Field names (especially: requestId, eligible, customerId, customerName, etc.)
   - Any joins needed

2. **Reportees Table Schema** - The table that stores SE users and their ABM relationships
   - Table name
   - Field names (SE_Id, SE_UserName, ABM_Id, ABM_UserName)

3. **Users Table Schema** - The table for ABM user validation
   - Table name
   - Field names for username validation

## 📝 Current Placeholder Queries

The queries use these placeholder table names:
- `campaign.DiscountRequest` - for requests
- `campaign.Reportees` - for reportees
- `campaign.ABMUsers` - for user validation

**These need to be updated with your actual table names!**

## 🚀 Production Deployment

1. Build the backend:
```bash
npm run build
```

2. Set production environment variables
3. Run with:
```bash
npm start
```

## 🔐 Security Notes

- Never commit `.env` file (already in `.gitignore`)
- Use environment variables for all sensitive data
- Consider using a connection pool with limited connections
- Add rate limiting for production

## 📞 Support

If you encounter issues:
1. Check database connection (credentials, network access)
2. Verify table names and field names match your schema
3. Check CORS settings if frontend can't connect
4. Review console logs for detailed error messages

