import express from 'express';
import { fetchBudget } from '../controllers/budgetController.js';

const router = express.Router();

router.get('/budget', fetchBudget);

export default router;

