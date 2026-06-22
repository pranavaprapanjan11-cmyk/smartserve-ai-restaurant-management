import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import { Role } from '../auth/auth.types';
import {
  fetchHealthScore,
  fetchInventoryForecast,
  fetchMenuInsights,
  fetchRecommendations,
  fetchSalesForecast,
} from './ai.controller';

const router = Router();
router.use(authenticateJWT);

router.get('/sales-forecast', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchSalesForecast);
router.get('/inventory-forecast', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchInventoryForecast);
router.get('/menu-insights', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchMenuInsights);
router.get('/recommendations', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchRecommendations);
router.get('/health-score', authorizeRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN), fetchHealthScore);

export default router;
