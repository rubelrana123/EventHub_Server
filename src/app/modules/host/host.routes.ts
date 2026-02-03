import express from 'express'
import { HostController } from './host.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import validateRequest from '../../middlewares/validateRequest';
import { HostValidation } from './host.validation';

const router = express.Router();

 // Create a new host
router.get('/', HostController.getAllFromDB);

 // Get host by ID
router.get('/:id', HostController.getByIdFromDB);
// update a new host
router.patch(
    '/:id',
    auth(  UserRole.ADMIN, UserRole.HOST, UserRole.PARTICIPATOR),
    validateRequest(HostValidation.update),
    HostController.updateIntoDB
);

 // delete a host
router.delete(
    '/:id',
    auth(UserRole.ADMIN),
    HostController.deleteFromDB
);

 // soft delete a host
router.delete(
    '/soft/:id',
    auth(UserRole.ADMIN),
    HostController.softDelete);

export const HostRoutes = router