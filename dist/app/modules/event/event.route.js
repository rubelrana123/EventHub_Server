"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const event_controller_1 = require("./event.controller");
const fileUploader_1 = require("../../helper/fileUploader");
const event_validation_1 = require("./event.validation");
const router = express_1.default.Router();
router.post("/create-event", (0, auth_1.default)(client_1.UserRole.HOST), fileUploader_1.fileUploader.upload.single("file"), (req, res, next) => {
    req.body = event_validation_1.EventValidation.create.parse(JSON.parse(req.body.data));
    return event_controller_1.EventController.createEvent(req, res, next);
});
//publick get all events
router.get("/", event_controller_1.EventController.getAllEvents);
router.get("/:id", event_controller_1.EventController.getSingleEvent);
router.patch("/:id", (0, auth_1.default)(client_1.UserRole.HOST), event_controller_1.EventController.updateEvent);
router.patch("/soft/:id", (0, auth_1.default)(client_1.UserRole.ADMIN), event_controller_1.EventController.deleteEvent);
//booked event by participator
router.post("/:eventId/join", (0, auth_1.default)(client_1.UserRole.PARTICIPATOR), event_controller_1.EventController.joinEvent);
exports.EventRoutes = router;
