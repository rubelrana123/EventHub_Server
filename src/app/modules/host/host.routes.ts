import express from 'express'
import { HostController } from './host.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';
import { HostValidation } from './host.validation';

const router = express.Router();

 
router.get('/', HostController.getAllFromDB);

 
router.get('/:id', HostController.getByIdFromDB);

router.patch(
    '/:id',
    auth(  UserRole.ADMIN, UserRole.HOST),
    validateRequest(HostValidation.update),
    HostController.updateIntoDB
);

 
router.delete(
    '/:id',
    auth(UserRole.ADMIN),
    HostController.deleteFromDB
);

 
router.delete(
    '/soft/:id',
    auth(UserRole.ADMIN),
    HostController.softDelete);

export const HostRoutes = router