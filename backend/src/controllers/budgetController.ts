import { Request, Response } from 'express';
import pool from '../config/database.js';

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
    const { yearWeek } = req.query;
    
    if (!yearWeek || typeof yearWeek !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'yearWeek is required' 
      });
    }

    console.log('[Budget Controller] Fetching budget for yearWeek:', yearWeek);

    // Query the DiscountRequestAbmBudget table using the provided query format
    const query = `
      SELECT allocatedBudget, consumedBudget 
      FROM campaign.DiscountRequestAbmBudget 
      WHERE yearWeek = ?
    `;
    
    console.log('[Budget Controller] Executing query with yearWeek:', yearWeek);
    const [rows] = await pool.execute(query, [yearWeek]) as any;
    console.log('[Budget Controller] Query result:', rows);
    
    if (rows.length === 0) {
      // Return default values if no budget record found
      return res.json({
        success: true,
        data: {
          allocatedBudget: 0,
          consumedBudget: 0
        }
      });
    }

    const budget = rows[0];
    const allocated = parseFloat(budget.allocatedBudget) || 0;
    const consumed = parseFloat(budget.consumedBudget) || 0;

    res.json({
      success: true,
      data: {
        allocatedBudget: allocated,
        consumedBudget: consumed
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

