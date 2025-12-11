"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostRoutes = void 0;
const express_1 = __importDefault(require("express"));
const host_controller_1 = require("./host.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const host_validation_1 = require("./host.validation");
const router = express_1.default.Router();
router.get('/', host_controller_1.HostController.getAllFromDB);
router.get('/:id', host_controller_1.HostController.getByIdFromDB);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.HOST), (0, validateRequest_1.default)(host_validation_1.HostValidation.update), host_controller_1.HostController.updateIntoDB);
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN), host_controller_1.HostController.deleteFromDB);
router.delete('/soft/:id', (0, auth_1.default)(client_1.UserRole.ADMIN), host_controller_1.HostController.softDelete);
exports.HostRoutes = router;
