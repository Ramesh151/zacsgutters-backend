import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../utils/userforEmail.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  const {
    fullName,
    email,
    password,
    role,
    mobileNo,
    address,
    jobtitle,
    timeZone,
  } = req.body;

  try {
    if (
      [fullName, email, password, role, mobileNo].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
      $or: [{ email }],
    });

    if (existedUser) {
      throw new ApiError(409, "Email already exists");
    }
    let avatarUrl = "";
    if (req.file && req.file.path) {
      // avatarUrl = `/public/images/${req.file.filename}`;
      // avatarUrl = `${req.baseUrl}/public/images/${req.file.filename}`;
      avatarUrl = `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`;
      // avatarUrl = `${config.baseUrl}/images/${req.file.filename}`;
    }

    const user = await User.create({
      fullName,
      avatar: avatarUrl || "",
      email,
      role,
      password,
      mobileNo,
      address,
      jobtitle,
      timeZone,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -resettoken "
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    const sentemail = await sendWelcomeEmail(email, password);
    if (!sentemail) {
      throw new ApiError(500, "sending email error");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  } catch (error) {
    return next(error);
  }
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    throw new ApiError(400, "All input is required");
  }

  try {
    const user = await User.findOne({
      $or: [{ email }],
    });

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user Password credentials");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
      // secure: false,
      sameSite: "none",
      // SameSite:"Lax",
      // maxAge: 900000
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged In Successfully"
        )
      );
  } catch (error) {
    return next(error);
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const forgetPassword = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );
    user.refreshToken = refreshToken;
    const resetToken = accessToken;
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 2 * 60 * 60 * 1000;
    await user.save();
    await sendPasswordResetEmail(user.email, resetToken);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user.email,
          "Reset-Password email sent successfully"
        )
      );
  } catch (error) {
    return next(error);
  }
});

const forgetPasswordToken = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id);
    if (!user || Date.now() > user.resetTokenExpiry) {
      throw new ApiError(404, "Invalid or expired token");
    }
    // return res.redirect(302,  `https://high-oaks-media-crm.vercel.app/resetpassword?token=${token}`);
    return res
      .status(200)
      .json(new ApiResponse(200, [], "Email Token Verified successfully"));
  } catch (error) {
    return next(error);
  }
});

const resetPasswordForForget = asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  const { token } = req.query;

  if (
    !password ||
    !confirmPassword ||
    password.trim() !== confirmPassword.trim()
  ) {
    throw new ApiError(400, "Passwords do not match");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(decoded);

    const updatedUser = await User.findOneAndUpdate(
      { _id: decoded._id, resetTokenExpiry: { $gt: Date.now() } },
      {
        refreshToken: null,
        resetToken: null,
        resetTokenExpiry: null,
      },
      { new: true }
    );
    updatedUser.password = password;
    await updatedUser.save({ validateBeforeSave: false });

    if (!updatedUser) {
      throw new ApiError(404, "Invalid or expired token");
    }
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset successfully"));
  } catch (error) {
    throw error;
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  forgetPassword,
  forgetPasswordToken,
  resetPasswordForForget,
};
