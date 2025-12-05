import { Request, Response } from 'express';
import pool from '../config/database.js';

// Helper function to get current week (Monday to Sunday)
const getCurrentWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { monday, sunday };
};

// Helper function to format yearWeek (YYYY-WW format)
const getYearWeek = (date: Date) => {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-${weekNumber.toString().padStart(2, '0')}`;
};

export const fetchBudget = async (req: Request, res: Response) => {
  try {
    const { username } = req.query;
    
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Username is required' 
      });
    }

    const { monday, sunday } = getCurrentWeek();
    const yearWeek = getYearWeek(monday);

    // Query the DiscountRequestAbmBudget table
    const query = `
      SELECT 
        allocatedBudget,
        consumedBudget,
        yearWeek
      FROM campaign.DiscountRequestAbmBudget
      WHERE abmUsername = ? 
        AND yearWeek = ?
        AND Deleted = 0
      LIMIT 1
    `;
    
    const [rows] = await pool.execute(query, [username, yearWeek]) as any;
    
    if (rows.length === 0) {
      // Return default values if no budget record found
      return res.json({
        success: true,
        data: {
          allocatedBudget: 0,
          consumedBudget: 0,
          balance: 0,
          weekStart: monday.toISOString().split('T')[0],
          weekEnd: sunday.toISOString().split('T')[0],
          yearWeek
        }
      });
    }

    const budget = rows[0];
    const allocated = parseFloat(budget.allocatedBudget) || 0;
    const consumed = parseFloat(budget.consumedBudget) || 0;
    const balance = allocated - consumed;

    res.json({
      success: true,
      data: {
        allocatedBudget: allocated,
        consumedBudget: consumed,
        balance: balance,
        weekStart: monday.toISOString().split('T')[0],
        weekEnd: sunday.toISOString().split('T')[0],
        yearWeek
      }
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch budget',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

