import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Customer from "../models/customer.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as paypalService from "../services/paypalService.js";
import { validateCustomerInput } from "../validators/bookingValidators.js";
import { calculateTotalPrice } from "../utils/priceCalculator.js";
import logger from "../config/logger.js";
import {
  sendCustomerConfirmationEmail,
  sendAdminNotificationEmail,
} from "../utils/emailService.js";
const checkCustomer = asyncHandler(async (req, res, next) => {
  try {
    const {
      customerName,
      email,
      contactNumber,
      firstLineOfAddress,
      town,
      postcode,
      selectedDate,
      selectedTimeSlot,
      selectService,
      numberOfBedrooms,
      paymentMethod,
      message,
    } = req.body;

    // Validate input
    if (!email || !postcode || !selectedDate || !selectedTimeSlot) {
      throw new ApiError(400, "Required fields are missing.");
    }

    // Convert selectedDate to Date object
    const date = new Date(selectedDate);
    console.log("selectedDate", date);

    // Define valid postcodes
    const validPostcodes = ["RH10", "RH11", "RH12", "RH13"];
    const postcodePrefix = postcode.split(" ")[0].toUpperCase();

    // Check if the postcode is valid
    if (!validPostcodes.includes(postcodePrefix)) {
      throw new ApiError(
        400,
        "We do not currently service this postcode area."
      );
    }

    // Check for existing bookings on the selected date
    const existingCustomers = await Customer.find({ selectedDate: date });

    if (existingCustomers.length > 0) {
      const existingCustomer = existingCustomers[0];

      if (existingCustomer.postcode !== postcode) {
        throw new ApiError(
          400,
          `Bookings are already made for this date. Only customers from the same postcode area (${existingCustomer.postcode}) can book for this date.`
        );
      }

      if (
        existingCustomers.some(
          (customer) => customer.selectedTimeSlot === selectedTimeSlot
        )
      ) {
        throw new ApiError(
          400,
          `The selected time slot is already booked: ${selectedTimeSlot}`
        );
      }
    }

    // Check if the selected time slot is in the future
    const currentTime = new Date();
    const [startHour, startMinute] = selectedTimeSlot.split("-")[0].split(":");
    const selectedSlotDate = new Date(date);
    selectedSlotDate.setHours(
      parseInt(startHour, 10),
      parseInt(startMinute, 10)
    );

    if (selectedSlotDate <= currentTime) {
      throw new ApiError(
        400,
        "The selected time slot is in the past or too soon. Please select a future time slot."
      );
    }

    logger.info(`Attempting to create customer: ${email}`);
    return res
      .status(201)
      .json(new ApiResponse(200, {}, "Check Availability successful"));
  } catch (error) {
    logger.error(`Error Checking Availability for customer: ${error.message}`);
    next(error);
  }
});
const createCustomer = asyncHandler(async (req, res, next) => {
  try {
    const {
      customerName,
      email,
      contactNumber,
      firstLineOfAddress,
      town,
      postcode,
      selectedDate,
      selectedTimeSlot,
      selectService,
      gutterCleaningOptions,
      gutterRepairsOptions,
      selectHomeType,
      selectHomeStyle,
      numberOfBedrooms,
      numberOfStories,
      paymentMethod,
      message,
    } = req.body;

    // Define valid postcodes
    const validPostcodes = ["RH10", "RH11", "RH12", "RH13"];
    const postcodePrefix = postcode.split(" ")[0].toUpperCase();

    // Validate postcode
    if (!validPostcodes.includes(postcodePrefix)) {
      throw new ApiError(
        400,
        "We do not currently service this postcode area."
      );
    }

    // Validate required fields
    if (
      !customerName ||
      !email ||
      !postcode ||
      !selectedDate ||
      !selectedTimeSlot ||
      !selectService
    ) {
      throw new ApiError(400, "Required fields are missing.");
    }

    // Check for existing bookings on the selected date
    const existingBookings = await Customer.find({
      selectedDate: new Date(selectedDate),
    });

    if (existingBookings.length > 0) {
      const existingCustomer = existingBookings[0];

      if (existingCustomer.postcode !== postcode) {
        throw new ApiError(
          400,
          `Bookings are already made for this date. Only customers from the same postcode area (${existingCustomer.postcode}) can book for this date.`
        );
      }

      if (
        existingBookings.some(
          (booking) => booking.selectedTimeSlot === selectedTimeSlot
        )
      ) {
        throw new ApiError(
          400,
          `The selected time slot is already booked: ${selectedTimeSlot}`
        );
      }
    }

    // Validate that the selected time slot is in the future
    const currentTime = new Date();
    const [startHour, startMinute] = selectedTimeSlot.split("-")[0].split(":");
    const selectedSlotDate = new Date(selectedDate);
    selectedSlotDate.setHours(
      parseInt(startHour, 10),
      parseInt(startMinute, 10)
    );

    if (selectedSlotDate <= currentTime) {
      throw new ApiError(
        400,
        "The selected time slot is in the past or too soon. Please select a future time slot."
      );
    }

    logger.info(`Attempting to create customer: ${email}`);

    // Calculate price
    const price = calculateTotalPrice(req.body);
    console.log("price", price);

    // Create and save new customer
    const newCustomer = new Customer({
      customerName,
      email,
      contactNumber,
      firstLineOfAddress,
      town,
      postcode,
      selectedDate,
      selectedTimeSlot,
      selectService,
      gutterCleaningOptions,
      gutterRepairsOptions,
      selectHomeType,
      selectHomeStyle,
      totalPrice: price,
      numberOfBedrooms,
      numberOfStories,
      message,
      paymentMethod,
      isLocked: true,
    });
    await newCustomer.save();

    // Handle PayPal payment if applicable
    if (paymentMethod === "PayPal") {
      const order = await paypalService.createOrder(price, {
        selectedDate,
        selectedTimeSlot,
        selectService,
        selectHomeType,
        selectHomeStyle,
      });
      newCustomer.paypalOrderId = order.id;
      await newCustomer.save();

      const approvalUrl = order.links.find(
        (link) => link.rel === "approve"
      ).href;

      logger.info(
        `PayPal order created for customer: ${email}, orderId: ${order.id}`
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            customer: newCustomer,
            paypalOrderId: order.id,
            approvalUrl: approvalUrl,
          },
          "Proceed to PayPal payment"
        )
      );
    }

    // Success response
    return res
      .status(201)
      .json(
        new ApiResponse(201, { customer: newCustomer }, "Booking successful")
      );
  } catch (error) {
    logger.error(`Error creating customer: ${error.message}`);
    next(error);
  }
});
const capturePayment = asyncHandler(async (req, res, next) => {
  const captureDetails = req.body;
  const { id: orderID, status, purchase_units } = captureDetails;

  // Find the customer based on the PayPal order ID
  const customer = await Customer.findOne({ paypalOrderId: orderID });

  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  // Check if payment has already been captured
  if (customer.paymentStatus === "completed") {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { customer }, "Payment has already been captured.")
      );
  }

  try {
    // Process completed payment
    if (status === "COMPLETED") {
      customer.paymentStatus = "completed";
      customer.isBooked = true;
      customer.isLocked = false;
      customer.lockExpiresAt = null;

      // Save updated customer details
      await customer.save();

      // Extract booking details
      const bookingDetails = {
        date: customer.selectedDate,
        timeSlot: customer.selectedTimeSlot,
        amount: purchase_units[0].amount.value,
        serviceDescription: purchase_units[0].description,
      };

      // Send confirmation email to the customer
      await sendCustomerConfirmationEmail(customer, bookingDetails);
      // Send notification email to the admin
      await sendAdminNotificationEmail(
        customer,
        bookingDetails,
        captureDetails
      );

      console.log(
        `Payment captured successfully for customer: ${customer.email}`
      );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { captureDetails, customer },
            "Payment captured successfully."
          )
        );
    } else {
      // Handle failed payment
      await unlockSlot(customer.selectedDate, customer.selectedTimeSlot);
      customer.paymentStatus = "failed";
      await customer.save();

      console.log(`Payment capture failed for customer: ${customer.email}`);
      throw new ApiError(400, "Payment capture failed.");
    }
  } catch (error) {
    next(error);
  }
});
const cancelPayment = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.params;

  // const customer = await Customer.findOne({ paypalOrderId: bookingId });
  // if (!customer) {
  //   throw new ApiError(404, " customerId Booking not found");
  // }
  // if (customer.paymentStatus !== "pending") {
  //   throw new ApiError(
  //     400,
  //     "This booking's payment has already been processed or cancelled"
  //   );
  // }
  try {
    // Fetch order details from PayPal
    const order = await paypalService.checkOrderStatus(bookingId);
    console.log("orderrr", order);

    if (order.status !== "CANCELLED") {
      throw new ApiError(400, "Order is not canceled.");
    }

    // Find the customer based on the PayPal order ID
    const customer = await Customer.findOne({ paypalOrderId: bookingId });

    if (!customer) {
      throw new ApiError(404, "Customer not found.");
    }

    // Update customer record
    customer.paymentStatus = "canceled";
    customer.isBooked = false;
    customer.isLocked = false;
    customer.lockExpiresAt = null;

    // Unlock any resources or slots
    await unlockSlot(customer.selectedDate, customer.selectedTimeSlot);

    // Save updated customer details
    await customer.save();

    // Send cancellation email to the customer
    // await sendCustomerCancellationEmail(customer);

    // // Send notification email to the admin
    // await sendAdminCancellationNotificationEmail(customer);

    console.log(
      `Payment cancellation processed successfully for customer: ${customer.email}`
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { order, customer },
          "Payment cancellation processed successfully."
        )
      );
  } catch (error) {
    console.error("Cancellation error:", error);
    next(error);
  }
  // try {
  //   // customer.paymentStatus = "cancelled";
  //   // await customer.save();
  //   // logger.info(`Booking cancelled for customer: ${customer.email}`);
  //   await Customer.findByIdAndDelete(customer._id);
  //   return res.json(
  //     new ApiResponse(200, { customer }, "Booking successfully cancelled")
  //   );
  // } catch (error) {
  //   logger.error(`Error cancelling booking: ${error.message}`);
  //   throw new ApiError(500, "Error cancelling booking", {
  //     error: error.message,
  //   });
  // }
});
const refundPaymentHandler = asyncHandler(async (req, res, next) => {
  const { captureId, refundAmount } = req.body;

  if (!captureId || !refundAmount) {
    throw new ApiError(400, "Capture ID and refund amount are required.");
  }

  try {
    // Process refund
    const refundDetails = await paypalService.refundPayment(
      captureId,
      refundAmount
    );

    // Find the customer based on the captureId
    const customer = await Customer.findOne({ paypalCaptureId: captureId });

    if (!customer) {
      throw new ApiError(404, "Customer not found.");
    }

    // Update customer record
    customer.paymentStatus = "refunded";
    customer.isBooked = false;
    customer.isLocked = false;
    customer.lockExpiresAt = null;
    await customer.save();

    // Send refund notifications
    await sendCustomerRefundEmail(customer, refundDetails);
    await sendAdminRefundNotificationEmail(customer, refundDetails);

    console.log(
      `Refund processed successfully for customer: ${customer.email}`
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { refundDetails, customer },
          "Refund processed successfully."
        )
      );
  } catch (error) {
    console.error("Refund error:", error);
    next(error);
  }
});
const handleCanceledPayment = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;

  if (!orderId) {
    throw new ApiError(400, "Order ID is required.");
  }

  try {
    // Fetch order details from PayPal
    const order = await paypalService.checkOrderStatus(orderId);

    if (order.status !== "CANCELLED") {
      throw new ApiError(400, "Order is not canceled.");
    }

    // Find the customer based on the PayPal order ID
    const customer = await Customer.findOne({ paypalOrderId: orderId });

    if (!customer) {
      throw new ApiError(404, "Customer not found.");
    }

    // Update customer record
    customer.paymentStatus = "canceled";
    customer.isBooked = false;
    customer.isLocked = false;
    customer.lockExpiresAt = null;

    // Unlock any resources or slots
    await unlockSlot(customer.selectedDate, customer.selectedTimeSlot);

    // Save updated customer details
    await customer.save();

    // Send cancellation email to the customer
    await sendCustomerCancellationEmail(customer);

    // Send notification email to the admin
    await sendAdminCancellationNotificationEmail(customer);

    console.log(
      `Payment cancellation processed successfully for customer: ${customer.email}`
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { order, customer },
          "Payment cancellation processed successfully."
        )
      );
  } catch (error) {
    console.error("Cancellation error:", error);
    next(error);
  }
});

export { cancelPayment, capturePayment, createCustomer, checkCustomer };

// const createCustomer = asyncHandler(async (req, res, next) => {
//   try {
//     // Validate input
//     validateCustomerInput(req.body);

//     // Destructure and sanitize input
//     const customerData = sanitizeCustomerInput(req.body);

//     // Validate postcode
//     validatePostcode(customerData.postcode);

//     // Check date availability
//     await checkDateAvailability(customerData.selectedDate);

//     // Lock time slot
//     const lockedCustomer = await lockTimeSlot(
//       customerData.selectedDate,
//       customerData.selectedTimeSlot
//     );

//     // Calculate price
//     const price = calculatePrice(
//       customerData.selectService,
//       customerData.numberOfBedrooms,
//       customerData.numberOfStories
//     );

//     // Create and save customer
//     const newCustomer = await createAndSaveCustomer(
//       customerData,
//       lockedCustomer.lockExpiresAt
//     );

//     // Handle payment
//     if (customerData.paymentMethod === "PayPal") {
//       const paypalResponse = await handlePayPalPayment(newCustomer, price);
//       return res
//         .status(200)
//         .json(
//           new ApiResponse(200, paypalResponse, "Proceed to PayPal payment")
//         );
//     }

//     return res
//       .status(201)
//       .json(
//         new ApiResponse(201, { customer: newCustomer }, "Booking successful")
//       );
//   } catch (error) {
//     await unlockSlot(customerData.selectedDate, customerData.selectedTimeSlot);
//     logger.error(`Error creating customer: ${error.message}`);
//     next(error);
//   }
// });

// Helper functions

// const validateCustomerInput = (body) => {
//   const { error } = customerInputSchema.validate(body);
//   if (error) {
//     throw new ApiError(
//       400,
//       error.details.map((detail) => detail.message).join(", ")
//     );
//   }
// };

// const sanitizeCustomerInput = (body) => {
//   // Destructure and return sanitized input
//   // Add any necessary sanitation logic here
// };

// const validatePostcode = (postcode) => {
//   const mumbaiPostcodes = ["400001", "400002" /* ... */]; // Move this to a config file
//   const postcodePrefix = postcode.split(" ")[0].toUpperCase();
//   if (!mumbaiPostcodes.includes(postcodePrefix)) {
//     throw new ApiError(400, "We do not currently service this postcode area.");
//   }
// };

// const checkDateAvailability = async (selectedDate) => {
//   const existingCustomer = await Customer.findOne({
//     selectedDate: new Date(selectedDate),
//   });
//   if (existingCustomer) {
//     throw new ApiError(
//       400,
//       `This date is already booked by another customer: ${existingCustomer.email}`
//     );
//   }
// };

// const lockTimeSlot = async (selectedDate, selectedTimeSlot) => {
//   const lockedCustomer = await lockSlot(selectedDate, selectedTimeSlot);
//   if (!lockedCustomer) {
//     throw new ApiError(400, "Slot is not available");
//   }
//   return lockedCustomer;
// };

// const createAndSaveCustomer = async (customerData, lockExpiresAt) => {
//   const newCustomer = new Customer({
//     ...customerData,
//     isLocked: true,
//     lockExpiresAt,
//   });
//   await newCustomer.save();
//   return newCustomer;
// };

// const handlePayPalPayment = async (customer, price) => {
//   const order = await paypalService.createOrder(price, {
//     selectedDate: customer.selectedDate,
//     selectedTimeSlot: customer.selectedTimeSlot,
//     selectService: customer.selectService,
//     numberOfBedrooms: customer.numberOfBedrooms,
//     numberOfStories: customer.numberOfStories,
//   });

//   customer.paypalOrderId = order.id;
//   await customer.save();

//   logger.info(
//     `PayPal order created for customer: ${customer.email}, orderId: ${order.id}`
//   );

//   const approvalUrl = order.links.find((link) => link.rel === "approve").href;

//   return {
//     customer,
//     paypalOrderId: order.id,
//     approvalUrl,
//   };
// };
