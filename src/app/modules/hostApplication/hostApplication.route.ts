


import express from 'express' 
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
 
import { HostApplicationController } from './hostApplication.controller';
 
const router = express.Router();
router.post('/', 
    auth(UserRole.PARTICIPATOR),
    HostApplicationController.applyForHost
);
 
router.get('/', HostApplicationController.getAllHostApplications);

 
router.get('/:id', HostApplicationController.getHostApplicationById);

router.patch(
    '/process/:id',
    auth(UserRole.ADMIN),
    HostApplicationController.processHostApplication
);
router.patch(
    '/:id',
    auth(UserRole.ADMIN),
    HostApplicationController.deleteHostApplication
);


export const HostApplicationRoutes = router