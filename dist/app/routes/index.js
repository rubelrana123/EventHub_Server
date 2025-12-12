"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_routes_1 = require("../modules/user/user.routes");
const auth_routes_1 = require("../modules/auth/auth.routes");
const participator_route_1 = require("../modules/participator/participator.route");
const admin_route_1 = require("../modules/admin/admin.route");
const hostApplication_route_1 = require("../modules/hostApplication/hostApplication.route");
const event_route_1 = require("../modules/event/event.route");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: '/user',
        route: user_routes_1.userRoutes
    },
    {
        path: "/auth",
        route: auth_routes_1.authRoutes
    },
    {
        path: "/admin",
        route: admin_route_1.AdminRoutes
    },
    {
        path: "/participator",
        route: participator_route_1.ParticipatorRoutes
    },
    {
        path: "/host-application",
        route: hostApplication_route_1.HostApplicationRoutes
    },
    {
        path: "/event",
        route: event_route_1.EventRoutes
    }
];
moduleRoutes.forEach(route => router.use(route.path, route.route));
exports.default = router;
