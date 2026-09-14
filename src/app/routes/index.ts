import { Router } from 'express';
import authRoutes from '@modules/auth/auth.route';
import userRoutes from '@modules/user/user.route';
// import gridRoutes from '@modules/grid/grid.route';
// import outageRoutes from '@modules/outage/outage.route';
// import scheduleRoutes from '@modules/schedule/schedule.route';
// import paymentRoutes from '@modules/payment/payment.route';
// import analyticsRoutes from '@modules/analytics/analytics.route';
// import publicRoutes from '@modules/public/public.route';
// import internalRoutes from '@modules/internal/internal.route';

const router = Router();

const moduleRoutes = [
  { path: '/auth', route: authRoutes },
  { path: '/users', route: userRoutes },
  // { path: '/grid', route: gridRoutes },
  // { path: '/outages', route: outageRoutes },
  // { path: '/schedules', route: scheduleRoutes },
  // { path: '/payments', route: paymentRoutes },
  // { path: '/analytics', route: analyticsRoutes },
  // { path: '/public', route: publicRoutes },
  // { path: '/internal', route: internalRoutes },
];

moduleRoutes.forEach((m) => router.use(m.path, m.route));

export default router;