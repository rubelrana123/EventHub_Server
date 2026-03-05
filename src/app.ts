import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import config from './config';
import router from './app/routes';
import cookieParser from 'cookie-parser'
import { PaymentController } from './app/modules/payment/payment.controller';
 

const app: Application = express();
app.use(cookieParser());

const normalizeUrl = (url?: string) => url?.trim().replace(/\/+$/, "");

const getAllowedOrigins = () => {
    const fromEnv = (config.corsOrigins || config.frontendUrl || "")
        .split(",")
        .map((origin) => normalizeUrl(origin))
        .filter((origin): origin is string => Boolean(origin));
    return [...new Set(fromEnv)];
};

const allowedOrigins = getAllowedOrigins();
// Stripe webhook endpoint
app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    PaymentController.handleStripeWebhookEvent
);
app.use(cors({
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
app.use(express.json());
// to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
// routes
app.use("/api/v1", router);

app.get('/', (req: Request, res: Response) => {
    res.send({
        message: "Server is running..",
        environment: config.node_env,
        uptime: process.uptime().toFixed(2) + " sec",
        timeStamp: new Date().toISOString()
    })
});
// global error handler
app.use(globalErrorHandler);

app.use(notFound);

export default app;
