"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const config_1 = __importDefault(require("./config"));
const routes_1 = __importDefault(require("./app/routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const payment_controller_1 = require("./app/modules/payment/payment.controller");
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
const normalizeUrl = (url) => url === null || url === void 0 ? void 0 : url.trim().replace(/\/+$/, "");
const getAllowedOrigins = () => {
    const fromEnv = (config_1.default.corsOrigins || config_1.default.frontendUrl || "")
        .split(",")
        .map((origin) => normalizeUrl(origin))
        .filter((origin) => Boolean(origin));
    return [...new Set(fromEnv)];
};
const allowedOrigins = getAllowedOrigins();
// Stripe webhook endpoint
app.post("/webhook", express_1.default.raw({ type: "application/json" }), payment_controller_1.PaymentController.handleStripeWebhookEvent);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const normalizedOrigin = normalizeUrl(origin);
        // allow requests with no origin (server-to-server, curl, postman)
        if (!normalizedOrigin) {
            return callback(null, true);
        }
        if (allowedOrigins.length > 0 && allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));
//parser 
app.use(express_1.default.json());
// to parse URL-encoded data
app.use(express_1.default.urlencoded({ extended: true }));
// routes
app.use("/api/v1", routes_1.default);
app.get('/', (req, res) => {
    res.send({
        message: "Server is running..",
        environment: config_1.default.node_env,
        uptime: process.uptime().toFixed(2) + " sec",
        timeStamp: new Date().toISOString()
    });
});
// global error handler
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
