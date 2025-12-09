import express, { NextFunction, Request, Response } from 'express'
import { UserController } from './user.controller';
import { fileUploader } from '../../helper/fileUploader';
import { UserValidation } from './user.validation';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';


const router = express.Router();

router.get(
    "/",
    auth(UserRole.ADMIN),
    UserController.getAllFromDB
)

router.post(
    "/create-participator",
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = UserValidation.createParticipatorValidationSchema.parse(JSON.parse(req.body.data))
        return UserController.createParticipator(req, res, next)
    }
)

router.post(
    "/create-admin",
    auth(UserRole.ADMIN),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = UserValidation.createAdminValidationSchema.parse(JSON.parse(req.body.data))
        return UserController.createAdmin(req, res, next)
    }
);

router.post(
    "/host-application",
    auth(UserRole.ADMIN, UserRole.PARTICIPATOR, UserRole.HOST),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        console.log(JSON.parse(req.body.data))
        req.body = UserValidation.createHostValidationSchema.parse(JSON.parse(req.body.data))
        return UserController.createHost(req, res, next)
    }
);

export const userRoutes = router;