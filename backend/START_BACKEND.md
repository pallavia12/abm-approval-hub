# How to Start the Backend Server

## Issue
If you're seeing "Budget endpoint not available" or budget values showing as 0, the backend server is likely not running.

## Steps to Start Backend

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start the backend server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ✅ Database connected successfully
   🚀 Backend server running on port 3001
   📡 CORS enabled for: http://localhost:5173
   ```

4. **Verify the backend is running:**
   - Open browser and go to: `http://localhost:3001/health`
   - You should see: `{"status":"ok","message":"Backend server is running"}`

5. **Check frontend configuration:**
   - Make sure you have a `.env` file in the root directory (not in backend folder)
   - Add this line: `VITE_API_BASE_URL=http://localhost:3001`
   - Restart your frontend dev server after adding the env variable

## Testing the Budget Endpoint

Once backend is running, test the budget endpoint:
```bash
curl "http://localhost:3001/api/budget?yearWeek=2024-49"
```

Replace `2024-49` with the actual yearWeek value you want to test.

## Debugging

Check the backend console logs for:
- Database connection status
- Available yearWeek values in the database
- Query results
- Any error messages

Check the browser console for:
- API request URL
- Response status
- Response data
- Any error messages

