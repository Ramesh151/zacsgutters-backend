import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      "http://localhost:5173",
      "https://www.sandbox.paypal.com",
      "https://zacsgutters.vercel.app",
      "https://high-oaks-media-crm.vercel.app",
    ],
    credentials: true,
    secure: false,
    optionSuccessStatus: 200,
    Headers: true,
    exposedHeaders: "Set-Cookie",
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Access-Control-Allow-Origin",
      "Content-Type",
      "Authorization",
    ],
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/public", express.static(path.join(__dirname, "..", "public")));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.render("bookingForm");
});
// Serve static files from the React app
// app.use(express.static(path.join(__dirname, "client/build")));

// // For any other routes, serve the React app
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "client/build", "index.html"));
// });

//routes import
import userRouter from "./routes/user.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import paymentRoute from "./routes/payment.route.js";

//routes declaration
app.use("/api/users", userRouter);
app.use("/api/customers", customerRoutes);
app.use("/", paymentRoute);

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    console.error(`API Error: ${err.message}`);
    if (err.errors.length > 0) {
      console.error("Validation Errors:", err.errors);
    }

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      stack: err.stack,
    });
  }
  console.error("Internal Server Error:", err);
  return res.status(500).json({
    success: false,
    message: err.message,
    // errors: err.errors,
    stack: err.stack,
  });
}

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: "No route found" });
});

export { app };
