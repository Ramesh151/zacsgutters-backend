// services/paypalService.js
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

function environment() {
  let clientId = process.env.PAYPAL_CLIENT_ID;
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}

export async function createOrder(amount, bookingDetails) {
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: amount.toString(),
        },
        description: `Service: ${bookingDetails.selectService}, Date: ${bookingDetails.selectedDate}, Time: ${bookingDetails.selectedTimeSlot}`,
      },
    ],
    application_context: {
      return_url: "http://localhost:5173/paypal/return", // Specify your return_url here
      cancel_url: "http://localhost:5173/booking-cancelled", // Specify your cancel_url here
    },
  });

  const order = await client().execute(request);
  return order.result;
}

export async function capturePayment(orderId) {
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});
  const response = await client().execute(request);
  console.log("responce nn", response);
  return response.result;
}

export async function checkOrderStatus(orderId) {
  const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId);
  const response = await client().execute(request);
  return response.result;
}

// import Booking from '../models/Booking.js';

// const LOCK_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// export async function lockSlot(date, timeSlot) {
//   const booking = await Booking.findOneAndUpdate(
//     {
//       date,
//       timeSlot,
//       isLocked: false,
//       $or: [
//         { lockExpiresAt: { $lt: new Date() } },
//         { lockExpiresAt: { $exists: false } }
//       ]
//     },
//     {
//       isLocked: true,
//       lockExpiresAt: new Date(Date.now() + LOCK_DURATION)
//     },
//     { new: true }
//   );

//   return booking;
// }

// export async function unlockSlot(bookingId) {
//   await Booking.findByIdAndUpdate(bookingId, {
//     isLocked: false,
//     lockExpiresAt: null
//   });
// }
