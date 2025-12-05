import express from 'express';
import { fetchRequests, updateRequest } from '../controllers/requestController.js';

const router = express.Router();

// Match n8n webhook endpoints for easy migration
router.post('/fetch-requests', fetchRequests);
router.post('/update-discount-request', updateRequest);

export default router;

