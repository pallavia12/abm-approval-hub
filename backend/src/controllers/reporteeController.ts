import { Request, Response } from 'express';
import pool from '../config/database.js';

export const fetchReportees = async (req: Request, res: Response) => {
  try {
    const { ABM_UserName } = req.body;
    
    if (!ABM_UserName) {
      return res.status(400).json({ 
        success: false, 
        message: 'ABM_UserName is required' 
      });
    }

    // TODO: Update table name and query based on your actual schema
    // This is a placeholder query - adjust based on your actual table structure
    const query = `
      SELECT DISTINCT 
        SE_Id, 
        SE_UserName, 
        ABM_Id, 
        ABM_UserName 
      FROM campaign.Reportees
      WHERE ABM_UserName = ?
      ORDER BY SE_UserName
    `;
    
    const [rows] = await pool.execute(query, [ABM_UserName]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reportees:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reportees',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

