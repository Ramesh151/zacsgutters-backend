import Customer from "../models/customer.model.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../config/logger.js";

const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

const lockSlot = async (selectedDate, selectedTimeSlot) => {
  logger.info(`Attempting to lock slot: ${selectedDate} ${selectedTimeSlot}`);

  const existingBooking = await Customer.findOne({
    selectedDate,
    selectedTimeSlot,
    $or: [
      { isLocked: true, lockExpiresAt: { $gt: new Date() } },
      { paymentStatus: "completed" },
    ],
  });

  if (existingBooking) {
    logger.warn(
      `Slot ${selectedDate} ${selectedTimeSlot} is already locked or booked`
    );
    return null;
  }

  const lockExpiresAt = new Date(Date.now() + LOCK_DURATION);

  const lockedCustomer = await Customer.findOneAndUpdate(
    { selectedDate, selectedTimeSlot, isLocked: false },
    { isLocked: true, lockExpiresAt },
    { new: true, upsert: true }
  );

  logger.info(`Slot locked successfully:${selectedDate} ${selectedTimeSlot}`);
  return lockedCustomer;
};

const unlockSlot = async (selectedDate, selectedTimeSlot) => {
  logger.info(`Attempting to unlock slot: ${selectedDate} ${selectedTimeSlot}`);

  const unlockedCustomer = await Customer.findOneAndUpdate(
    { selectedDate, selectedTimeSlot, isLocked: true },
    { isLocked: false, lockExpiresAt: null },
    { new: true }
  );
  console.log("unlocked customer", unlockedCustomer);

  if (!unlockedCustomer) {
    logger.warn(
      `No locked slot found to unlock: ${selectedDate} ${selectedTimeSlot}`
    );
    return null;
  }

  logger.info(
    `Slot unlocked successfully: ${selectedDate} ${selectedTimeSlot}`
  );
  return unlockedCustomer;
};

const cleanExpiredLocks = async () => {
  logger.info("Cleaning expired locks");

  const result = await Customer.updateMany(
    { isLocked: true, lockExpiresAt: { $lte: new Date() } },
    { isLocked: false, lockExpiresAt: null }
  );

  logger.info(`Cleaned ${result.nModified} expired locks`);
};

export { lockSlot, unlockSlot, cleanExpiredLocks };

// services/bookingService.js

// import Customer from "../models/customer.model.js";

// // import Booking from '../models/Booking.js';

// const LOCK_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// export async function lockSlot(date, timeSlot) {
//   const booking = await Customer.findOneAndUpdate(
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
//   console.log(booking,"hghgthfthtthththththth");
//   return booking;
// }

// export async function unlockSlot(bookingId) {
//   await Customer.findByIdAndUpdate(bookingId, {
//     isLocked: false,
//     lockExpiresAt: null
//   });
// }
