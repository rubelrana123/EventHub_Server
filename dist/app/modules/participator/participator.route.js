"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipatorRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const participator_controller_1 = require("./participator.controller");
const router = express_1.default.Router();
router.get("/", 
// auth(UserRole.ADMIN),
participator_controller_1.ParticipatorController.getAllParticipator);
router.get('/:id', participator_controller_1.ParticipatorController.getByIdFromDB);
router.patch("/", (0, auth_1.default)(client_1.UserRole.PARTICIPATOR), participator_controller_1.ParticipatorController.updateIntoDB);
router.delete("/:id", (0, auth_1.default)(client_1.UserRole.ADMIN), participator_controller_1.ParticipatorController.deleteParticipatorFromDB);
router.post("/join/:eventId", (0, auth_1.default)(client_1.UserRole.PARTICIPATOR), participator_controller_1.ParticipatorController.createParticipation);
exports.ParticipatorRoutes = router;
