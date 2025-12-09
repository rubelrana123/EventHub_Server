import express from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { ParticipatorRoutes } from '../modules/participator/participator.route';
import { AdminRoutes } from '../modules/admin/admin.route';
import { HostApplicationRoutes } from '../modules/hostApplication/hostApplication.route';


const router = express.Router();

const moduleRoutes = [
        {
        path: '/user',
        route: userRoutes
    },
    {
        path : "/auth",
        route : authRoutes
    },
    {
        path : "/admin",
        route : AdminRoutes
    },
    {
        path : "/participator",
        route : ParticipatorRoutes
    },
    {
        path : "/host-application",
        route : HostApplicationRoutes
    }
 
];

moduleRoutes.forEach(route => router.use(route.path, route.route))

export default router;