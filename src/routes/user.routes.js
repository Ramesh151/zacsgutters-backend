import { Router } from "express";

import {
  loginUser,
  logoutUser,
  registerUser,
  resetPasswordForForget,
  forgetPasswordToken,
  forgetPassword,
  refreshToken,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadForfile } from "../middlewares/multer.middleware.js";

const router = Router();
router.route("/").post(uploadForfile.array, registerUser);
router.route("/login").post(loginUser);
//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/forget").post(forgetPassword);
router.route("/refresh-token").post(refreshToken);
router.route("/reset-password-token/:token").get(forgetPasswordToken);
router.route("/reset-password/").patch(resetPasswordForForget);

export default router;
