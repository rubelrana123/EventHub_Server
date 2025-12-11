"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostApplicationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const hostApplication_controller_1 = require("./hostApplication.controller");
const router = express_1.default.Router();
router.post('/', (0, auth_1.default)(client_1.UserRole.PARTICIPATOR), hostApplication_controller_1.HostApplicationController.applyForHost);
router.get('/', hostApplication_controller_1.HostApplicationController.getAllHostApplications);
router.get('/:id', hostApplication_controller_1.HostApplicationController.getHostApplicationById);
router.patch('/process/:id', (0, auth_1.default)(client_1.UserRole.ADMIN), hostApplication_controller_1.HostApplicationController.processHostApplication);
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN), hostApplication_controller_1.HostApplicationController.deleteHostApplication);
exports.HostApplicationRoutes = router;
