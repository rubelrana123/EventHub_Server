"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const fileUploader_1 = require("../../helper/fileUploader");
const user_validation_1 = require("./user.validation");
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
router.get("/", (0, auth_1.default)(client_1.UserRole.ADMIN), user_controller_1.UserController.getAllFromDB);
router.post("/create-participator", fileUploader_1.fileUploader.upload.single('file'), (req, res, next) => {
    req.body = user_validation_1.UserValidation.createParticipatorValidationSchema.parse(JSON.parse(req.body.data));
    return user_controller_1.UserController.createParticipator(req, res, next);
});
router.post("/create-admin", (0, auth_1.default)(client_1.UserRole.ADMIN), fileUploader_1.fileUploader.upload.single('file'), (req, res, next) => {
    req.body = user_validation_1.UserValidation.createAdminValidationSchema.parse(JSON.parse(req.body.data));
    return user_controller_1.UserController.createAdmin(req, res, next);
});
router.post("/host-application", (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.PARTICIPATOR, client_1.UserRole.HOST), fileUploader_1.fileUploader.upload.single('file'), (req, res, next) => {
    console.log(JSON.parse(req.body.data));
    req.body = user_validation_1.UserValidation.createHostValidationSchema.parse(JSON.parse(req.body.data));
    return user_controller_1.UserController.createHost(req, res, next);
});
exports.userRoutes = router;
