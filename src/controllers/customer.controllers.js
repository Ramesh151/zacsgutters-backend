import Customer from "../models/customer.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const checkAvailability = asyncHandler(async (req, res, next) => {
  const { date, timeSlot, postcode } = req.body;

  try {
    const CustomerExists = await Customer.findOne({ date, postcode, timeSlot });

    if (CustomerExists) {
      throw new ApiError(
        400,
        "This timeslot is already booked for the selected date and postcode."
      );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "The timeslot is available for Customer.")
      );
  } catch (error) {
    next(error);
  }
});

const cancelPayment = asyncHandler(async (req, res) => {
  try {
    const { CustomerId } = req.params;

    const Customer = await Customer.findById(CustomerId);
    if (!Customer) {
      return res.status(404).json({ message: "बुकिंग नहीं मिली" });
    }

    if (Customer.paymentStatus !== "pending") {
      return res.status(400).json({
        message:
          "इस बुकिंग का भुगतान पहले ही पूरा हो चुका है या रद्द किया जा चुका है",
      });
    }

    await CustomerService.unlockSlot(CustomerId);
    Customer.paymentStatus = "cancelled";
    await Customer.save();

    res.json({ message: "बुकिंग सफलतापूर्वक रद्द कर दी गई", Customer });
  } catch (error) {
    res
      .status(500)
      .json({ message: "बुकिंग रद्द करने में त्रुटि", error: error.message });
  }
});

export { cancelPayment, checkAvailability };
