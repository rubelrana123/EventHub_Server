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
// Create a new host
router.get('/', host_controller_1.HostController.getAllFromDB);
// Host: get all participators who joined my events
router.get('/my-event-participators', (0, auth_1.default)(client_1.UserRole.HOST), host_controller_1.HostController.getMyEventParticipators);
router.get('/my-event-reviews', (0, auth_1.default)(client_1.UserRole.HOST), host_controller_1.HostController.getMyEventReviews);
// Get host by ID
router.get('/:id', host_controller_1.HostController.getByIdFromDB);
// update a new host
router.patch('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.HOST, client_1.UserRole.PARTICIPATOR), (0, validateRequest_1.default)(host_validation_1.HostValidation.update), host_controller_1.HostController.updateIntoDB);
// delete a host
router.delete('/:id', (0, auth_1.default)(client_1.UserRole.ADMIN), host_controller_1.HostController.deleteFromDB);
// soft delete a host
router.delete('/soft/:id', (0, auth_1.default)(client_1.UserRole.ADMIN), host_controller_1.HostController.softDelete);
exports.HostRoutes = router;
