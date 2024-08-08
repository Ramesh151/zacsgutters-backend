// routes/bookingRoutes.js
import express from "express";
import {
  createCustomer,
  cancelPayment,
  capturePayment,
  capturePayments,
  checkCustomer,
} from "../controllers/payment.controller.js";

const router = express.Router();
router.post("/check", checkCustomer);
router.post("/create", createCustomer);
router.post("/api/capture-payment", capturePayment);
router.post("/capture-payment", capturePayments);
router.post("/:bookingId/cancel", cancelPayment);
export default router;
