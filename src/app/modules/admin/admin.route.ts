import express from "express";
 
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { AdminController } from "./admin.controller";
 
 

const router = express.Router();
 

// 2. **Admin Management**

//    - Implement **get all Admins** with **pagination, filtering, searching, and sorting**.
//    - Implement **get Admin by ID** functionality.
//    - Implement **update Admin by ID** functionality.
//    - Implement **delete Admin by ID** functionality.
 
router.get(
    "/",
    // auth(UserRole.ADMIN),
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