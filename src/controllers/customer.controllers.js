import Customer from "../models/customer.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import moment from "moment";

const TIME_SLOTS = [
  "9:00-9:45 AM",
  "9:45-10:30 AM",
  "10:30-11:15 AM",
  "11:15-12:00 PM",
  "12:00-12:45 PM",
  "12:45-1:30 PM",
  "1:30-2:15 PM",
  "2:15-3:00 PM",
];

const checkAvailability = asyncHandler(async (req, res, next) => {
  const { postcode } = req.body;

  if (!postcode) {
    return next(new ApiError(400, "Postcode is required."));
  }

  const startDate = moment().startOf("day");
  const endDate = moment().add(10, "days").endOf("day");

  try {
    const customers = await Customer.find({
      postcode,
      selectedDate: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    });

    const availability = {};

    for (let i = 0; i <= 10; i++) {
      const currentDate = moment().add(i, "days").format("YYYY-MM-DD");

      // Get all booked slots for the current date
      const bookedSlots = customers
        .filter(
          (customer) =>
            moment(customer.selectedDate).format("YYYY-MM-DD") === currentDate
        )
        .map((customer) => customer.selectedTimeSlot);

      // Set availability for each time slot
      availability[currentDate] = TIME_SLOTS.map((slot) => ({
        selectedTimeSlot: slot,
        isBooked: bookedSlots.includes(slot),
      }));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, availability, "Availability checked successfully.")
      );
  } catch (error) {
    console.error("Error checking availability:", error);
    next(new ApiError(500, "Internal server error."));
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
