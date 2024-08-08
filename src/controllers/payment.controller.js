import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Customer from "../models/customer.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as paypalService from "../services/paypalService.js";
import { validateCustomerInput } from "../validators/bookingValidators.js";
import { calculatePrice } from "../utils/priceCalculator.js";
import logger from "../config/logger.js";
import {
  sendCustomerConfirmationEmail,
  sendAdminNotificationEmail,
} from "../utils/emailService.js";
const createCustom = asyncHandler(async (req, res, next) => {
  // const { error } = validateCustomerInput(req.body);
  // if (error) {
  //   throw new ApiError(
  //     400,
  //     error.details.map((detail) => detail.message).join(", ")
  //   );
  // }
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
    numberOfStories,
    howDidYouHearAboutUs,
    file,
    paymentMethod,
    message,
  } = req.body;
  //   const postcodePrefix = postcode.split(" ")[0].toUpperCase();
  // console.log("postcode",postcodePrefix);

  //   if (!allowedPostcodes.includes(postcodePrefix)) {
  //     throw new ApiError(400, "We do not currently service this postcode area.");
  //   }
  const mumbaiPostcodes = [
    "400001", // Fort
    "400002", // Kalbadevi
    "400003", // Mandvi
    "400004", // Girgaon
    "400005", // Colaba
    "400006", // Malabar Hill
    "400007", // Grant Road
    "400008", // Charni Road
    "400009", // Mumbai Central
    "400010", // Mazgaon
    "400011", // Byculla
    "400012", // Dadar
    "400013", // Nagpada
    "400014", // Parel
    "400015", // Matunga
    "400016", // Mahim
    "400017", // Bandra
    "400018", // Khar
    "400019", // Santacruz
    "400020", // Vile Parle
    "400021", // Marine Lines
    "400022", // Churchgate
    "400023", // Bhuleshwar
    "400024", // Worli
    "400025", // Prabhadevi
    "400026", // Cotton Green
    "400027", // Kalachowki
    "400028", // Parel Naka
    "400029", // Juhu
    "400030", // Versova
    // Add more postcodes as needed
  ];

  const postcodePrefix = postcode.split(" ")[0].toUpperCase();
  if (!mumbaiPostcodes.includes(postcodePrefix)) {
    throw new ApiError(400, "We do not currently service this postcode area.");
  }
  const existingCustomer = await Customer.findOne({
    selectedDate: new Date(selectedDate),
  });
  console.log("exiting book", existingCustomer);
  if (existingCustomer) {
    if (existingCustomer.postcode === postcode)
      throw new ApiError(
        400,
        `this serice today only this code: ${existingCustomer.postcode}`
      );
  }
  logger.info(`Attempting to create customer: ${email}`);
  try {
    const price = calculatePrice(
      selectService,
      numberOfBedrooms,
      numberOfStories
    );

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
      numberOfBedrooms,
      numberOfStories,
      howDidYouHearAboutUs,
      file,
      message,
      paymentMethod,
      isLocked: true,
    });
    await newCustomer.save();

    if (paymentMethod === "PayPal") {
      const order = await paypalService.createOrder(price, {
        selectedDate,
        selectedTimeSlot,
        selectService,
        numberOfBedrooms,
        numberOfStories,
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
          "proceed to PayPal payment"
        )
      );
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, { customer: newCustomer }, "Booking successful")
      );
  } catch (error) {
    // await unlockSlot(selectedDate, selectedTimeSlot);
    logger.error(`Error creating customer: ${error.message}`);
    next(error);
  }
});
const checkCustomer = asyncHandler(async (req, res, next) => {
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
    numberOfStories,
    howDidYouHearAboutUs,
    paymentMethod,
    message,
  } = req.body;
  let avatarUrls = [];

  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      const avatarUrl = `${req.protocol}://${req.get("host")}/images/${
        file.filename
      }`;
      avatarUrls.push(avatarUrl);
    });
  }

  // Now `avatarUrls` contains URLs for all the uploaded files.

  const mumbaiPostcodes = [
    "400001", // Fort
    "400002", // Kalbadevi
    "400003", // Mandvi
    "400004", // Girgaon
    "400005", // Colaba
    "400006", // Malabar Hill
    "400007", // Grant Road
    "400008", // Charni Road
    "400009", // Mumbai Central
    "400010", // Mazgaon
    "400011", // Byculla
    "400012", // Dadar
    "400013", // Nagpada
    "400014", // Parel
    "400015", // Matunga
    "400016", // Mahim
    "400017", // Bandra
    "400018", // Khar
    "400019", // Santacruz
    "400020", // Vile Parle
    "400021", // Marine Lines
    "400022", // Churchgate
    "400023", // Bhuleshwar
    "400024", // Worli
    "400025", // Prabhadevi
    "400026", // Cotton Green
    "400027", // Kalachowki
    "400028", // Parel Naka
    "400029", // Juhu
    "400030", // Versova
  ];

  const postcodePrefix = postcode.split(" ")[0].toUpperCase();
  if (!mumbaiPostcodes.includes(postcodePrefix)) {
    throw new ApiError(400, "We do not currently service this postcode area.");
  }

  const existingCustomers = await Customer.find({
    selectedDate: new Date(selectedDate),
  });
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
  const selectedSlotDate = new Date(selectedDate);
  selectedSlotDate.setHours(parseInt(startHour, 10), parseInt(startMinute, 10));

  if (selectedSlotDate <= currentTime) {
    throw new ApiError(
      400,
      "The selected time slot is in the past or too soon. Please select a future time slot."
    );
  }

  logger.info(`Attempting to create customer: ${email}`);
  try {
    return res
      .status(201)
      .json(new ApiResponse(200, {}, "Check Avablity successful"));
  } catch (error) {
    logger.error(`Error Check Availaty customer: ${error.message}`);
    next(error);
  }
});
const createCustomer = asyncHandler(async (req, res, next) => {
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
    numberOfStories,
    howDidYouHearAboutUs,
    paymentMethod,
    message,
  } = req.body;
  let avatarUrls = [];

  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      const avatarUrl = `${req.protocol}://${req.get("host")}/images/${
        file.filename
      }`;
      avatarUrls.push(avatarUrl);
    });
  }
  const mumbaiPostcodes = [
    "400001", // Fort
    "400002", // Kalbadevi
    "400003", // Mandvi
    "400004", // Girgaon
    "400005", // Colaba
    "400006", // Malabar Hill
    "400007", // Grant Road
    "400008", // Charni Road
    "400009", // Mumbai Central
    "400010", // Mazgaon
    "400011", // Byculla
    "400012", // Dadar
    "400013", // Nagpada
    "400014", // Parel
    "400015", // Matunga
    "400016", // Mahim
    "400017", // Bandra
    "400018", // Khar
    "400019", // Santacruz
    "400020", // Vile Parle
    "400021", // Marine Lines
    "400022", // Churchgate
    "400023", // Bhuleshwar
    "400024", // Worli
    "400025", // Prabhadevi
    "400026", // Cotton Green
    "400027", // Kalachowki
    "400028", // Parel Naka
    "400029", // Juhu
    "400030", // Versova
  ];
  const postcodePrefix = postcode.split(" ")[0].toUpperCase();
  if (!mumbaiPostcodes.includes(postcodePrefix)) {
    throw new ApiError(400, "We do not currently service this postcode area.");
  }

  const existingCustomers = await Customer.find({
    selectedDate: new Date(selectedDate),
  });
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
  const selectedSlotDate = new Date(selectedDate);
  selectedSlotDate.setHours(parseInt(startHour, 10), parseInt(startMinute, 10));

  if (selectedSlotDate <= currentTime) {
    throw new ApiError(
      400,
      "The selected time slot is in the past or too soon. Please select a future time slot."
    );
  }

  logger.info(`Attempting to create customer: ${email}`);
  try {
    const price = calculatePrice(
      selectService,
      numberOfBedrooms,
      numberOfStories
    );

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
      numberOfBedrooms,
      numberOfStories,
      howDidYouHearAboutUs,
      file: avatarUrls,
      message,
      paymentMethod,
      isLocked: true,
    });
    await newCustomer.save();

    if (paymentMethod === "PayPal") {
      const order = await paypalService.createOrder(price, {
        selectedDate,
        selectedTimeSlot,
        selectService,
        numberOfBedrooms,
        numberOfStories,
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
          "proceed to PayPal payment"
        )
      );
    }

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
const capturePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  // Assuming there's a way to find the customer by orderId, for example:
  const customer = await Customer.findOne({ paypalOrderId: orderId });
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  if (customer.paymentStatus !== "pending") {
    throw new ApiError(
      400,
      "This booking's payment has already been processed or cancelled"
    );
  }

  try {
    const captureData = await paypalService.capturePayment(orderId);

    if (captureData.status === "COMPLETED") {
      customer.paymentStatus = "completed";
      customer.paypalOrderId = orderId;
      customer.isLocked = false;
      customer.lockExpiresAt = null;
      await customer.save();

      logger.info(
        `Payment captured successfully for customer: ${customer.email}`
      );
      return res.json(
        new ApiResponse(
          200,
          { captureData, customer },
          "Payment captured successfully"
        )
      );
    } else {
      customer.paymentStatus = "failed";
      await customer.save();

      logger.warn(`Payment capture failed for customer: ${customer.email}`);
      throw new ApiError(400, "Payment could not be captured", {
        captureData,
        customer,
      });
    }
  } catch (error) {
    logger.error(`Error capturing payment: ${error.message}`);
    throw new ApiError(500, "Error capturing payment", {
      error: error.message,
    });
  }
});
// const capturePayments = asyncHandler(async (req, res) => {
//   const captureDetails = req.body;
//   const { id: orderID } = captureDetails;
//   const customer = await Customer.findOne({ paypalOrderId: orderID });
//   if (!customer) {
//     throw new ApiError(404, "Customer not found.");
//   }
//   if (!customer) {
//     throw new ApiError(404, "Customer not found.");
//   }
//   if (customer.paymentStatus === "completed") {
//     console.log(
//       `Payment has already been captured for customer: ${customer.email}`
//     );
//     return res.status(200).json({
//       status: 200,
//       data: { customer },
//       message: "Payment has already been captured.",
//     });
//   }

//   try {
//     if (captureDetails.status === "COMPLETED") {
//       customer.paymentStatus = "completed";
//       customer.isLocked = false;
//       customer.lockExpiresAt = null;
//       await customer.save();
//       // Send confirmation email to the customer
//       await sendCustomerConfirmationEmail(customer, {
//         date: customer.selectedDate,
//         timeSlot: customer.selectedTimeSlot,
//         amount: captureDetails.purchase_units[0].amount.value,
//         serviceDescription: captureDetails.purchase_units[0].description,
//       });

//       // Send notification email to the admin
//       await sendAdminNotificationEmail(customer, {
//         date: customer.selectedDate,
//         timeSlot: customer.selectedTimeSlot,
//         amount: captureDetails.purchase_units[0].amount.value,
//         serviceDescription: captureDetails.purchase_units[0].description,
//       });

//       console.log(
//         `Payment captured successfully for customer: ${customer.email}`
//       );
//       return res.json({
//         status: 200,
//         data: { captureDetails, customer },
//         message: "Payment captured successfully.",
//       });
//     } else {
//       await unlockSlot(customer.selectedDate, customer.selectedTimeSlot);
//       customer.paymentStatus = "failed";
//       await customer.save();

//       console.log(`Payment capture failed for customer: ${customer.email}`);
//       throw new ApiError(400, "Payment capture failed.");
//     }
//   } catch (error) {
//     console.error("Error updating payment status:", error.message);
//     throw new ApiError(
//       500,
//       "An error occurred while updating the payment status."
//     );
//   }
// });

const capturePayments = asyncHandler(async (req, res, next) => {
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
const cancelPayment = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const customer = await Customer.findOne({ paypalOrderId: bookingId });
  if (!customer) {
    throw new ApiError(404, " customerId Booking not found");
  }
  if (customer.paymentStatus !== "pending") {
    throw new ApiError(
      400,
      "This booking's payment has already been processed or cancelled"
    );
  }
  try {
    // customer.paymentStatus = "cancelled";
    // await customer.save();
    // logger.info(`Booking cancelled for customer: ${customer.email}`);
    await Customer.findByIdAndDelete(customer._id);
    return res.json(
      new ApiResponse(200, { customer }, "Booking successfully cancelled")
    );
  } catch (error) {
    logger.error(`Error cancelling booking: ${error.message}`);
    throw new ApiError(500, "Error cancelling booking", {
      error: error.message,
    });
  }
});

export {
  cancelPayment,
  capturePayment,
  createCustomer,
  capturePayments,
  checkCustomer,
};

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
