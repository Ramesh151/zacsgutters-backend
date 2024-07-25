
import express from 'express';
import { checkAvailability } from '../controllers/customer.controllers.js';
// import { validateCheckAvailability } from '../validators/bookingValidators.js';

const router = express.Router();

router.post('/check-availability', checkAvailability);

export default router;