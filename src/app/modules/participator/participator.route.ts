 
import express from "express";
 
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { ParticipatorController } from "./participator.controller";
 

const router = express.Router();
 
 
router.get(
    "/",
    // auth(UserRole.ADMIN),
    ParticipatorController.getAllParticipator
)
 

router.patch(
    "/",
    auth(UserRole.PARTICIPATOR),
    ParticipatorController.updateIntoDB
)

router.delete(
    "/:id",
    auth(UserRole.ADMIN),
    ParticipatorController.deleteParticipatorFromDB
)
export const ParticipatorRoutes = router;