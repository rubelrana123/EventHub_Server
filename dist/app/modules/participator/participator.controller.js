"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipatorController = void 0;
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const participator_service_1 = require("./participator.service");
const participator_constant_1 = require("./participator.constant");
const pick_1 = __importDefault(require("../../helper/pick"));
const getAllParticipator = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = (0, pick_1.default)(req.query, participator_constant_1.participatorFilterableFields); // searching , filtering
    const options = (0, pick_1.default)(req.query, ["page", "limit", "sortBy", "sortOrder"]); // pagination and sorting
    const result = yield participator_service_1.ParticipatorService.getAllParticipator(filters, options);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Participators fetched successfully!",
        data: result
    });
}));
const updateIntoDB = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield participator_service_1.ParticipatorService.updateIntoDB(user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Participator updated successfully',
        data: result,
    });
}));
const deleteParticipatorFromDB = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield participator_service_1.ParticipatorService.deleteParticipatorFromDB(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Participator deleted successfully!",
        data: result
    });
}));
const getByIdFromDB = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield participator_service_1.ParticipatorService.getByIdFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Participator retrieval successfully',
        data: result,
    });
}));
const createParticipation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    const result = yield participator_service_1.ParticipatorService.createParticipation(eventId, req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Event joined successfully",
        data: result,
    });
}));
exports.ParticipatorController = {
    getAllParticipator,
    updateIntoDB,
    deleteParticipatorFromDB,
    getByIdFromDB,
    createParticipation
};
