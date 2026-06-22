import { Response } from 'express';
import { RequestWithUser } from '../auth/auth.types';
import {
  getHealthScore,
  getInventoryForecast,
  getMenuInsights,
  getRecommendations,
  getSalesForecast,
} from './ai.service';

export async function fetchSalesForecast(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await getSalesForecast(req.user.id, req.user.role);
    return res.json(result);
  } catch (err: any) {
    console.error('fetchSalesForecast error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch sales forecast' });
  }
}

export async function fetchInventoryForecast(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await getInventoryForecast(req.user.id, req.user.role);
    return res.json(result);
  } catch (err: any) {
    console.error('fetchInventoryForecast error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch inventory forecast' });
  }
}

export async function fetchMenuInsights(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await getMenuInsights(req.user.id, req.user.role);
    return res.json(result);
  } catch (err: any) {
    console.error('fetchMenuInsights error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch menu insights' });
  }
}

export async function fetchRecommendations(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await getRecommendations(req.user.id, req.user.role);
    return res.json(result);
  } catch (err: any) {
    console.error('fetchRecommendations error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch recommendations' });
  }
}

export async function fetchHealthScore(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await getHealthScore(req.user.id, req.user.role);
    return res.json(result);
  } catch (err: any) {
    console.error('fetchHealthScore error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch health score' });
  }
}
