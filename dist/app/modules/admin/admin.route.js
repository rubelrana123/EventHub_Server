"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const admin_controller_1 = require("./admin.controller");
const router = express_1.default.Router();
router.get("/", 
// auth(UserRole.ADMIN),
admin_controller_1.AdminController.getAllAdmin);
router.patch("/:id", (0, auth_1.default)(client_1.UserRole.ADMIN), admin_controller_1.AdminController.updateAdminById);
router.delete("/:id", (0, auth_1.default)(client_1.UserRole.ADMIN), admin_controller_1.AdminController.deleteAdminFromDB);
exports.AdminRoutes = router;
