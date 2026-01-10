import express from "express";
 
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { AdminController } from "./admin.controller";
 
 

const router = express.Router();
 
 
router.get(
    "/",
    auth(UserRole.ADMIN),
    AdminController.getAllAdmin
)
 

router.patch(
    "/:id",
    auth(UserRole.ADMIN),
    AdminController.updateAdminById
)

router.delete(
    "/:id",
    auth(UserRole.ADMIN),
    AdminController.deleteAdminFromDB
)
export const AdminRoutes = router;