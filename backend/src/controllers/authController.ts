import { Request, Response } from 'express';
import pool from '../config/database.js';

export const checkAbmUser = async (req: Request, res: Response) => {
  try {
    const { username } = req.query;
    
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Username is required' 
      });
    }

    // TODO: Update table name and query based on your actual schema
    // This is a placeholder query - adjust based on your actual table structure
    const query = `
      SELECT COUNT(*) as count 
      FROM campaign.ABMUsers 
      WHERE ABM_UserName = ? AND Deleted = 0
    `;
    
    const [rows] = await pool.execute(query, [username]) as any;
    const count = rows[0]?.count || 0;
    
    if (count > 0) {
      res.json({ status: 'success', message: 'User found' });
    } else {
      res.json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    console.error('Error checking ABM user:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to validate user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

