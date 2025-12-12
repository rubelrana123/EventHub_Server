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
exports.HostApplicationController = void 0;
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const pick_1 = __importDefault(require("../../helper/pick"));
const hostApplication_service_1 = require("./hostApplication.service");
// ===============================
// CREATE APPLICATION (Participator)
// ===============================
const applyForHost = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { message } = req.body;
    const user = req.user;
    console.log(user, "user from controller", message);
    const result = yield hostApplication_service_1.HostApplicationService.applyForHost(user, message);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Host application submitted successfully.",
        data: result,
    });
}));
// ===============================
// ADMIN → PROCESS APPLICATION (APPROVE/REJECT)
// ===============================
const processHostApplication = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params; // applicationId
    const { action, adminNote } = req.body;
    const adminEmail = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    const result = yield hostApplication_service_1.HostApplicationService.processHostApplication(id, action, adminEmail, adminNote);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: `Host application ${action.toLowerCase()} successfully.`,
        data: result,
    });
}));
// ===============================
// ADMIN → GET ALL APPLICATIONS
// ===============================
const getAllHostApplications = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = (0, pick_1.default)(req.query, ["status", "userId"]);
    const options = (0, pick_1.default)(req.query, ["limit", "page", "sortBy", "sortOrder"]);
    const result = yield hostApplication_service_1.HostApplicationService.getAllHostApplications(filters, options);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Host applications retrieved successfully.",
        meta: result.meta,
        data: result.data,
    });
}));
// ===============================
// USER → GET THEIR APPLICATIONS
// ===============================
const getUserHostApplications = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const result = yield hostApplication_service_1.HostApplicationService.getUserHostApplications(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "User host applications retrieved successfully.",
        data: result,
    });
}));
// ===============================
// ADMIN → GET SINGLE APPLICATION
// ===============================
const getHostApplicationById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield hostApplication_service_1.HostApplicationService.getHostApplicationById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Host application retrieved successfully.",
        data: result,
    });
}));
const deleteHostApplication = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield hostApplication_service_1.HostApplicationService.deleteHostApplication(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Host application deleted successfully',
        data: result,
    });
}));
exports.HostApplicationController = {
    applyForHost,
    processHostApplication,
    getAllHostApplications,
    getUserHostApplications,
    getHostApplicationById,
    deleteHostApplication,
};
