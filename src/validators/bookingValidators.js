import Joi from "joi";

const validateCustomerInput = (data) => {
  const schema = Joi.object({
    customerName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    contactNumber: Joi.string()
      .pattern(/^[0-9]+$/)
      .min(10)
      .max(15)
      .required(),
    firstLineOfAddress: Joi.string().min(5).max(100).required(),
    town: Joi.string().min(2).max(50).required(),
    // postcode: Joi.string().pattern(/^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][ABD-HJLNP-UW-Z]{2}$/).required(),
    postcode: Joi.string(),
    selectedDate: Joi.date().iso().greater("now").required(),
    selectedTimeSlot: Joi.string()
      .valid(
        "9:00-9:45 AM",
        "9:45-10:30 AM",
        "10:30-11:15 AM",
        "11:15-12:00 PM",
        "12:00-12:45 PM",
        "12:45-1:30 PM",
        "1:30-2:15 PM",
        "2:15-3:00 PM"
      )
      .required(),
    selectService: Joi.string()
      .valid(
        "Gutter Cleaning",
        "Gutter Wash Down",
        "Gutter Repair",
        "Gutter Replacement",
        "Soffits and Fascias"
      )
      .required(),
    numberOfBedrooms: Joi.string()
      .valid("1", "2", "3", "4", "5", "6+")
      .required(),
    numberOfStories: Joi.string().valid("1", "2", "3", "4").required(),
    howDidYouHearAboutUs: Joi.string()
      .valid(
        "Search Engine",
        "Recommendation",
        "Social Media",
        "Flyers / Marketing",
        "Other"
      )
      .required(),
    file: Joi.optional(),
    paymentMethod: Joi.string().valid("PayPal", "cash", "online").required(),
    message: Joi.string().max(500).optional(),
    soffitsFascias: Joi.string()
      .valid(
        "House Terraced",
        "House Semi Detached",
        "Bungalow",
        "Flat",
        "Other"
      )
      .optional(),
  });

  return schema.validate(data, { abortEarly: false });
};

export { validateCustomerInput };

// import { body, validationResult } from 'express-validator';

// const validateCheckAvailability = [
//   body('date').isISO8601().toDate(),
//   body('timeSlot').isIn(['9-10 AM', '10-11 AM', '11-12 AM', '12-1 PM', '1-2 PM']),
//   body('postcode').isPostalCode('GB'),
//   (req, res, next) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return next(new ApiError(400, 'Validation Error', errors.array()));
//     }
//     next();
//   }
// ];

// export { validateCheckAvailability };
