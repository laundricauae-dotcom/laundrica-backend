// middleware/security.js

const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const securityMiddleware = (app) => {
    // ==========================
    // Helmet Security Headers
    // ==========================
    app.use(
        helmet({
            contentSecurityPolicy: process.env.NODE_ENV === "production"
                ? {
                    directives: {
                        defaultSrc: ["'self'"],

                        scriptSrc: [
                            "'self'",
                            "'unsafe-inline'",
                            "'unsafe-eval'",
                        ],

                        styleSrc: [
                            "'self'",
                            "'unsafe-inline'",
                            "https:",
                        ],

                        imgSrc: [
                            "'self'",
                            "data:",
                            "blob:",
                            "https:",
                        ],

                        fontSrc: [
                            "'self'",
                            "https:",
                            "data:",
                        ],

                        connectSrc: [
                            "'self'",
                            process.env.FRONTEND_URL,
                            "https://laundrica-backend-1.onrender.com",
                        ],

                        objectSrc: ["'none'"],

                        upgradeInsecureRequests: [],
                    },
                }
                : false,

            crossOriginEmbedderPolicy: false,
        })
    );

    // ==========================
    // CORS
    // ==========================
    const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL,
    ].filter(Boolean);

    app.use(
        cors({
            origin(origin, callback) {
                // Allow Postman/mobile apps/no origin
                if (!origin) {
                    return callback(null, true);
                }

                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }

                console.error("Blocked by CORS:", origin);

                return callback(new Error(`CORS blocked for origin: ${origin}`));
            },

            credentials: true,

            methods: [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS",
            ],

            allowedHeaders: [
                "Content-Type",
                "Authorization",
                "X-Requested-With",
                "X-Session-Id",
            ],

            exposedHeaders: [
                "Content-Length",
            ],

            maxAge: 86400,
        })
    );

    // ==========================
    // Compression
    // ==========================
    app.use(
        compression({
            level: 6,
            threshold: 1024,
        })
    );

    // ==========================
    // Mongo Sanitization
    // ==========================
    app.use(
        mongoSanitize({
            replaceWith: "_",
        })
    );

    // ==========================
    // XSS Protection
    // ==========================
    app.use(xss());

    // ==========================
    // Prevent Query Pollution
    // ==========================
    app.use((req, res, next) => {
        if (req.query && typeof req.query === "object") {
            for (const key in req.query) {
                if (
                    Array.isArray(req.query[key]) &&
                    req.query[key].length > 10
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Too many values for parameter",
                    });
                }
            }
        }

        next();
    });

    // ==========================
    // Security Headers
    // ==========================
    app.use((req, res, next) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        res.setHeader("X-XSS-Protection", "1; mode=block");
        res.setHeader(
            "Referrer-Policy",
            "strict-origin-when-cross-origin"
        );
        res.setHeader(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=()"
        );

        next();
    });
};

module.exports = securityMiddleware;