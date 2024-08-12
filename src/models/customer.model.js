import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    firstLineOfAddress: { type: String, required: true },
    town: { type: String, required: true },
    postcode: { type: String, required: true },
    selectedDate: { type: Date, required: true },
    totalPrice: { type: Number },
    selectedTimeSlot: {
      type: String,
      enum: [
        "9:00-9:45 AM",
        "9:45-10:30 AM",
        "10:30-11:15 AM",
        "11:15-12:00 PM",
        "12:00-12:45 PM",
        "12:45-1:30 PM",
        "1:30-2:15 PM",
        "2:15-3:00 PM",
      ],
      required: true,
    },
    selectService: {
      type: String,
      enum: ["Gutter Cleaning", "Gutter Repair"],
      required: true,
    },
    gutterCleaningOptions: {
      type: [String],
      enum: ["Garage", "Conservatory", "Extension"],
    },
    gutterRepairsOptions: {
      type: [String],
      enum: [
        "Running Outlet",
        "Union Joint",
        "Corner",
        "Gutter Bracket",
        "Downpipe",
        "Gutter Length Replacement",
      ],
    },
    selectHomeType: {
      type: String,
      enum: [
        "Bungalow",
        "2 bed House",
        "3 bed House",
        "4 bed House",
        "5 bed House",
        "Town House/3 Stories",
      ],
      required: true,
    },
    selectHomeStyle: {
      type: String,
      enum: ["Terrace", "Semi-Detached", "Detached"],
      required: true,
    },
    numberOfBedrooms: {
      type: String,
      enum: ["1", "2", "3", "4", "5", "6"],
    },
    numberOfStories: {
      type: String,
      enum: ["1", "2", "3", "4"],
    },
    message: { type: String },
    paymentMethod: {
      type: String,
      enum: ["PayPal"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    paypalOrderId: { type: String },
    isLocked: { type: Boolean, default: false },
    lockExpiresAt: { type: Date },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;

// import mongoose from "mongoose";

// const customerSchema = new mongoose.Schema(
//   {
//     customerName: { type: String, required: true },
//     email: { type: String, required: true },
//     contactNumber: { type: String },
//     firstLineOfAddress: { type: String, required: true },
//     town: { type: String, required: true },
//     postcode: { type: String, required: true },
//     selectedDate: { type: Date, required: true },
//     price: { type: Number },
//     selectedTimeSlot: {
//       type: String,
//       enum: [
//         "9:00-9:45 AM",
//         "9:45-10:30 AM",
//         "10:30-11:15 AM",
//         "11:15-12:00 PM",
//         "12:00-12:45 PM",
//         "12:45-1:30 PM",
//         "1:30-2:15 PM",
//         "2:15-3:00 PM",
//       ],
//       required: true,
//     },
//     selectService: {
//       type: String,
//       enum: ["Gutter Cleaning", "Gutter Repair"],
//       required: true,
//     },
//     selectPropertyType: {
//       type: String,
//       enum: [
//         "House Terraced",
//         "House Semi Detached",
//         "Bungalow",
//         "Flat",
//         "Other",
//       ],
//       // required: false,
//     },
//     numberOfBedrooms: {
//       type: String,
//       enum: ["1", "2", "3", "4", "5", "6"],
//       // required: true,
//     },
//     numberOfStories: {
//       type: String,
//       enum: ["1", "2", "3", "4"],
//       // required: true,
//     },

//     message: { type: String },
//     paymentMethod: {
//       type: String,
//       enum: ["PayPal"],
//       required: true,
//     },
//     paymentStatus: {
//       type: String,
//       enum: ["pending", "completed", "failed", "cancelled"],
//       default: "pending",
//     },

//     paypalOrderId: { type: String },
//     isLocked: { type: Boolean, default: false },
//     lockExpiresAt: { type: Date },
//     isBooked: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// const Customer = mongoose.model("Customer", customerSchema);

// export default Customer;

// import mongoose from "mongoose";

// // Customers Schema
// const customerSchema = new mongoose.Schema(
//   {
//     customerName: { type: String, required: true },
//     email: { type: String, required: true },
//     address: { type: String },
//   },
//   { timestamps: true }
// );

// const Customer = mongoose.model("Customer", customerSchema);

// // Orders Schema
// const orderSchema = new mongoose.Schema(
//   {
//     customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
//     totalAmount: { type: Number, required: true },
//     orderDate: { type: Date, default: Date.now },
//     paymentStatus: { type: String, enum: ["pending", "completed", "failed", "cancelled"], default: "pending" },
//     currency: { type: String },
//     paypalTransactionId: { type: String },
//     payerId: { type: String },
//   },
//   { timestamps: true }
// );

// const Order = mongoose.model("Order", orderSchema);

// // Order Items Schema
// const orderItemSchema = new mongoose.Schema(
//   {
//     order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
//     itemName: { type: String, required: true },
//     quantity: { type: Number, required: true },
//     unitPrice: { type: Number, required: true },
//   }
// );

// const OrderItem = mongoose.model("OrderItem", orderItemSchema);

// export { Customer, Order, OrderItem };
