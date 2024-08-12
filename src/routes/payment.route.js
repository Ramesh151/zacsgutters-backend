// routes/bookingRoutes.js
import express from "express";
import {
  createCustomer,
  cancelPayment,
  capturePayment,
  checkCustomer,
} from "../controllers/payment.controller.js";

const router = express.Router();
router.post("/check", checkCustomer);
router.post("/create", createCustomer);
router.post("/capture-payment", capturePayment);
router.post("/:bookingId/cancel", cancelPayment);
export default router;
