import express from 'express';
import { fetchReportees } from '../controllers/reporteeController.js';

const router = express.Router();

// Match n8n webhook endpoints for easy migration
router.post('/get-reportees', fetchReportees);

export default router;

