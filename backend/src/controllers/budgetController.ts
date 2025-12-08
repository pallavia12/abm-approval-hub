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

    // First, let's check what yearWeek values exist in the database
    const checkQuery = `
      SELECT DISTINCT yearWeek 
      FROM campaign.DiscountRequestAbmBudget 
      ORDER BY yearWeek DESC 
      LIMIT 10
    `;
    const [checkRows] = await pool.execute(checkQuery) as any;
    console.log('[Budget Controller] Available yearWeek values in DB:', checkRows.map((r: any) => r.yearWeek));

    // Query the DiscountRequestAbmBudget table using the provided query format
    const query = `
      SELECT allocatedBudget, consumedBudget 
      FROM campaign.DiscountRequestAbmBudget 
      WHERE yearWeek = ?
    `;
    
    console.log('[Budget Controller] Executing query:', query);
    console.log('[Budget Controller] Query parameters:', [yearWeek]);
    
    const [rows] = await pool.execute(query, [yearWeek]) as any;
    console.log('[Budget Controller] Query result rows:', rows.length);
    console.log('[Budget Controller] Query result data:', JSON.stringify(rows, null, 2));
    
    if (rows.length === 0) {
      console.log('[Budget Controller] No rows found for yearWeek:', yearWeek);
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
    console.log('[Budget Controller] Raw budget data:', budget);
    
    const allocated = parseFloat(budget.allocatedBudget) || 0;
    const consumed = parseFloat(budget.consumedBudget) || 0;
    
    console.log('[Budget Controller] Parsed values:', { allocated, consumed });

    res.json({
      success: true,
      data: {
        allocatedBudget: allocated,
        consumedBudget: consumed
      }
    });
  } catch (error) {
    console.error('[Budget Controller] Error fetching budget:', error);
    if (error instanceof Error) {
      console.error('[Budget Controller] Error message:', error.message);
      console.error('[Budget Controller] Error stack:', error.stack);
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch budget',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

