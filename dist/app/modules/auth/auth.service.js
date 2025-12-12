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
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../shared/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwtHelper_1 = require("../../helper/jwtHelper");
const config_1 = __importDefault(require("../../../config"));
const ApiError_1 = __importDefault(require("../../helper/ApiError"));
const emailSender_1 = __importDefault(require("./emailSender"));
const login = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: client_1.UserStatus.ACTIVE
        }
    });
    const isCorrectPassword = yield bcryptjs_1.default.compare(payload.password, userData.password);
    if (!isCorrectPassword) {
        throw new Error("Password incorrect!");
    }
    const accessToken = jwtHelper_1.jwtHelper.generateToken({
        email: userData.email,
        role: userData.role
    }, config_1.default.jwt.jwt_secret, config_1.default.jwt.expires_in);
    const refreshToken = jwtHelper_1.jwtHelper.generateToken({
        email: userData.email,
        role: userData.role
    }, config_1.default.jwt.refresh_token_secret, config_1.default.jwt.refresh_token_expires_in);
    return {
        accessToken,
        refreshToken,
        needPasswordChange: userData.needPasswordChange
    };
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    let decodedData;
    try {
        decodedData = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.refresh_token_secret);
    }
    catch (err) {
        throw new Error("You are not authorized!");
    }
    const userData = yield prisma_1.prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            status: client_1.UserStatus.ACTIVE
        }
    });
    const accessToken = jwtHelper_1.jwtHelper.generateToken({
        email: userData.email,
        role: userData.role
    }, config_1.default.jwt.jwt_secret, config_1.default.jwt.expires_in);
    const refreshToken = jwtHelper_1.jwtHelper.generateToken({
        email: userData.email,
        role: userData.role
    }, config_1.default.jwt.refresh_token_secret, config_1.default.jwt.refresh_token_expires_in);
    return {
        accessToken,
        refreshToken,
        needPasswordChange: userData.needPasswordChange
    };
});
const changePassword = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.prisma.user.findUniqueOrThrow({
        where: {
            email: user.email,
            status: client_1.UserStatus.ACTIVE
        }
    });
    const isCorrectPassword = yield bcryptjs_1.default.compare(payload.oldPassword, userData.password);
    if (!isCorrectPassword) {
        throw new Error("Password incorrect!");
    }
    const hashedPassword = yield bcryptjs_1.default.hash(payload.newPassword, Number(config_1.default.bcrypt_salt_rounds));
    yield prisma_1.prisma.user.update({
        where: {
            email: userData.email
        },
        data: {
            password: hashedPassword,
            needPasswordChange: false
        }
    });
    return {
        message: "Password changed successfully!"
    };
});
const forgotPassword = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: client_1.UserStatus.ACTIVE
        }
    });
    const resetPassToken = jwtHelper_1.jwtHelper.generateToken({ email: userData.email, role: userData.role }, config_1.default.jwt.refresh_token_secret, config_1.default.jwt.refresh_token_expires_in);
    const resetPassLink = config_1.default.resetPassLink + `?userId=${userData.id}&token=${resetPassToken}`;
    yield (0, emailSender_1.default)(userData.email, `
        <div>
            <p>Dear User,</p>
            <p>Your password reset link 
                <a href=${resetPassLink}>
                    <button>
                        Reset Password
                    </button>
                </a>
            </p>

        </div>
        `);
});
const resetPassword = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.prisma.user.findUniqueOrThrow({
        where: {
            id: payload.id,
            status: client_1.UserStatus.ACTIVE
        }
    });
    const isValidToken = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.refresh_token_secret);
    if (!isValidToken) {
        throw new ApiError_1.default(401, "Forbidden!");
    }
    // hash password
    const password = yield bcryptjs_1.default.hash(payload.password, Number(config_1.default.bcrypt_salt_rounds));
    // update into database
    yield prisma_1.prisma.user.update({
        where: {
            id: payload.id
        },
        data: {
            password,
            needPasswordChange: false
        }
    });
});
const getMe = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = user.accessToken;
    const decodedData = jwtHelper_1.jwtHelper.verifyToken(accessToken, config_1.default.jwt.jwt_secret);
    const userData = yield prisma_1.prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            status: client_1.UserStatus.ACTIVE,
        },
        select: {
            id: true,
            email: true,
            role: true,
            needPasswordChange: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            // ADMIN PROFILE
            admin: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    contactNumber: true,
                    isDeleted: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
            // HOST PROFILE
            host: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    contactNumber: true,
                    address: true,
                    isDeleted: true,
                    createdAt: true,
                    updatedAt: true,
                    // Host's Events
                    events: {
                        include: {
                            participators: {
                                include: {
                                    user: true,
                                },
                            },
                            reviews: true,
                        },
                    },
                },
            },
            // PARTICIPATOR PROFILE
            participator: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    address: true,
                    interests: true,
                    bio: true,
                    isDeleted: true,
                    createdAt: true,
                    updatedAt: true,
                    // Reviews given about this participator
                    reviews: true,
                },
            },
            // Reviews written by this user
            reviews: true,
            // Events created by this user (as creator)
            events: true,
            // User's participations (joined events)
            eventParticipations: {
                include: {
                    event: true,
                },
            },
            // Payments made by this user
            payments: true,
        },
    });
    return userData;
});
exports.AuthService = {
    login,
    getMe,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword
};
