import { genSalt } from "bcrypt";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { compare } from "bcrypt";
import User from "../models/UserModel.js";
import Group from "../models/GroupModel.js";
import Message from "../models/MessageModel.js";
import jwt from "jsonwebtoken";
import { renameSync, unlinkSync } from "fs";

const maxAge = 3 * 24 * 60 * 60 * 1000;

const adminEmail = process.env.ADMIN_EMAIL;
const resetLowerLimit = process.env.RESET_LOWER_LIMIT;

const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_KEY, {
    expiresIn: maxAge,
  });
};

export const signup = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const salt = await genSalt(10);
    const pepper = process.env.PEPPER_STRING;
    const hashedPassword = await bcrypt.hash(salt + password + pepper, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      salt: salt, // Store the salt for later use in password comparison
    });
    response.cookie("jwt", createToken(email, user.id), {
      maxAge,
      secure: true,
      sameSite: "None",
    });
    return response.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
        isAdmin: user.email === adminEmail,
        readReceiptsEnabled: user.readReceiptsEnabled,
      },
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const login = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response
        .status(400)
        .json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return response
        .status(400)
        .json({ error: "User with the given email does not exist" });
    }
    console.log(user);
    const pepper = process.env.PEPPER_STRING;
    const auth = await compare(user.salt + password + pepper, user.password);
    console.log(auth);
    if (!auth) {
      return response.status(400).json({ error: "Incorrect password" });
    }

    response.cookie("jwt", createToken(email, user.id), {
      maxAge,
      secure: true,
      sameSite: "None",
    });
    return response.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
        isAdmin: user.email === adminEmail,
        readReceiptsEnabled: user.readReceiptsEnabled,
      },
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const getUserInfo = async (request, response, next) => {
  try {
    const userData = await User.findById(request.userId);
    if (!userData) {
      return response.status(404).json({ error: "User not found" });
    }
    return response.status(200).json({
      id: userData.id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
      isAdmin: userData.email === adminEmail,
      readReceiptsEnabled: userData.readReceiptsEnabled,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (request, response, next) => {
  try {
    const { userId } = request;
    const { firstName, lastName, color, image } = request.body;
    if (!firstName || !lastName) {
      return response
        .status(400)
        .json({ error: "First name and last name are required" });
    }

    const userData = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, color, image, profileSetup: true },
      { new: true, runValidators: true }
    );
    return response.status(200).json({
      id: userData.id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
      isAdmin: userData.email === adminEmail,
      readReceiptsEnabled: userData.readReceiptsEnabled,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const updatePreferences = async (request, response, next) => {
  try {
    const { userId } = request;
    const { readReceiptsEnabled } = request.body;

    const userData = await User.findByIdAndUpdate(
      userId,
      { readReceiptsEnabled },
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      id: userData.id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
      isAdmin: userData.email === adminEmail,
      readReceiptsEnabled: userData.readReceiptsEnabled,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

// export const addProfileImage = async (request, response, next) => {
//   try {
//     if (!request.file) {
//       return response.status(400).json({ error: "Image is required" });
//     }

//     const date = Date.now();
//     let fileName = "uploads/profiles/" + date + request.file.originalname;
//     renameSync(request.file.path, fileName);

//     const updatedUser = await User.findByIdAndUpdate(
//       request.userId,
//       { image: fileName },
//       { new: true, runValidators: true }
//     );

//     return response.status(200).json({
//       image: updatedUser.image,
//     });
//   } catch (error) {
//     console.log(error);
//     return response.status(500).json({ error: error.message });
//   }
// };

// export const removeProfileImage = async (request, response, next) => {
//   try {
//     const { userId } = request;
//     const { firstName, lastName, color } = request.body;
//     const user = await User.findById(userId);

//     if (!user) {
//       return response.status(404).json({ error: "User not found" });
//     }

//     if (user.image) {
//       unlinkSync(user.image);
//     }

//     user.image = null;
//     await user.save();

//     const userData = await User.findByIdAndUpdate(
//       userId,
//       { firstName, lastName, color, profileSetup: true },
//       { new: true, runValidators: true }
//     );

//     return response.status(200).json({
//       message: "Profile image removed successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     return response.status(500).json({ error: error.message });
//   }
// };

export const logout = async (request, response, next) => {
  try {
    response.cookie("jwt", "", {
      maxAge: 1,
      secure: true,
      sameSite: "None",
    });

    return response.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const resetApp = async (request, response, next) => {
  try {
    const { resetDate } = request.body;

    if (resetDate <= resetLowerLimit) {
      return response.status(400).json({
        message: `Reset date (${resetDate.substring(
          0,
          10
        )}) must be after ${resetLowerLimit.substring(0, 10)}.`,
      });
    }

    const messagesToDelete = await Message.find({
      timestamp: { $gt: resetDate },
    }).select("_id");

    const messageIdsToDelete = messagesToDelete.map((msg) => msg._id);

    await Message.deleteMany({
      _id: { $in: messageIdsToDelete },
    });

    await Group.deleteMany({
      createdAt: { $gt: resetDate },
    });

    const groups = await Group.find({
      createdAt: { $lt: resetDate },
    });

    for (const group of groups) {
      await Group.updateOne(
        { _id: group._id },
        { $pull: { messages: { $in: messageIdsToDelete } } }
      );

      const lastMessageBeforeResetDate = await Message.findOne({
        _id: { $in: group.messages },
        timestamp: { $lt: resetDate },
      })
        .sort({ timestamp: -1 })
        .select("content messageType timestamp fileUrl");

      if (lastMessageBeforeResetDate) {
        group.lastMessage = lastMessageBeforeResetDate;
      } else {
        group.lastMessage = null;
      }

      await group.save();
    }

    return response
      .status(200)
      .json({ message: "Reset completed successfully" });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};
