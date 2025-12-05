import { Request, Response } from 'express';
import pool from '../config/database.js';

export const fetchRequests = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username is required' 
      });
    }

    // TODO: Update table name and query based on your actual schema
    // This is a placeholder query - adjust based on your actual table structure
    const query = `
      SELECT 
        requestId,
        eligible,
        customerId,
        customerName,
        customerContact,
        campaignType,
        skuId,
        orderQty,
        discountValue,
        discountType,
        reason,
        requestedBy,
        requestedByUserName,
        requestedByContact,
        ABM_Id,
        ABM_UserName,
        createdAt,
        abmStatus,
        abmReviewedAt,
        abmOrderQty,
        abmDiscountValue,
        abmDiscountType,
        abmRemarks,
        status,
        adminStatus,
        adminRemarks,
        adminDiscountValue,
        adminDiscountType
      FROM campaign.DiscountRequest
      WHERE ABM_UserName = ?
      ORDER BY createdAt DESC
    `;
    
    const [rows] = await pool.execute(query, [username]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateRequest = async (req: Request, res: Response) => {
  try {
    const { 
      ids, 
      abmStatus, 
      abmOrderQty, 
      abmDiscountType, 
      abmDiscountValue, 
      abmRemarks, 
      abmReviewedBy, 
      abmReviewedAt 
    } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Request IDs are required' 
      });
    }

    // TODO: Update table name and query based on your actual schema
    const placeholders = ids.map(() => '?').join(',');
    const updateQuery = `
      UPDATE campaign.DiscountRequest 
      SET 
        abmStatus = ?, 
        abmOrderQty = ?, 
        abmDiscountType = ?, 
        abmDiscountValue = ?, 
        abmRemarks = ?, 
        abmReviewedBy = ?, 
        abmReviewedAt = ?,
        UpdatedAt = CURRENT_TIMESTAMP
      WHERE requestId IN (${placeholders})
    `;
    
    await pool.execute(updateQuery, [
      abmStatus,
      abmOrderQty,
      abmDiscountType,
      abmDiscountValue,
      abmRemarks,
      abmReviewedBy,
      abmReviewedAt,
      ...ids
    ]);
    
    res.json({ success: true, message: 'Request updated successfully' });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

