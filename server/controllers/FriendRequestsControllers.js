import User from "../models/UserModel.js";
import mongoose from "mongoose";

export const createFriendRequest = async (request, response, next) => {
  try {
    const { friendRequest } = request.body; // Friend's user ID
    const userId = request.userId; // Current user's ID from token

    if (!friendRequest) {
      return response
        .status(400)
        .json({ error: "Friend request ID is required" });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return response.status(404).json({ error: "Current user not found" });
    }

    const friendRequestUser = await User.findOne({ email: friendRequest });

    // Find the user by their ID and update the friendRequests array
    const updatedUser = await User.findOneAndUpdate(
      { email: friendRequest }, // Find by friend's email
      { $addToSet: { friendRequests: currentUser.email } }, // Add current user's email to friend's requests
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return response.status(404).json({ error: "User not found" });
    }

    // Return only the friend request that was just added
    return response.status(201).json({
      message: "Friend request added successfully",
      target: friendRequestUser, // Return the newly added friend request ID
      requester: currentUser, // Return the current user's ID
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const rejectFriendRequest = async (request, response, next) => {
  try {
    const { friendRequest } = request.body; // Friend's email
    const userId = request.userId; // Current user's ID from token

    if (!friendRequest) {
      return response
        .status(400)
        .json({ error: "Friend request email is required" });
    }

    // Find the current user
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return response.status(404).json({ error: "User not found" });
    }

    const deletedUser = await User.findOne({ email: friendRequest });

    // Remove the friend's email from the friendRequests array
    currentUser.friendRequests = currentUser.friendRequests.filter(
      (email) => email !== friendRequest
    );

    // Save the updated user document
    await currentUser.save();

    return response.status(200).json({
      message: "Friend request deleted successfully",
      deletedRequest: deletedUser,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const acceptFriendRequest = async (request, response, next) => {
  try {
    const { friendEmail } = request.body; // Friend's email
    const userId = request.userId; // Current user's ID from token

    if (!friendEmail) {
      return response.status(400).json({ error: "Friend's email is required" });
    }

    // Find the current user
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return response.status(404).json({ error: "User not found" });
    }

    const friendRequestUser = await User.findOne({ email: friendEmail });

    // Check if the friend request exists
    const friendRequestExists =
      currentUser.friendRequests.includes(friendEmail);
    if (!friendRequestExists) {
      return response.status(400).json({ error: "Friend request not found" });
    }

    // Remove the friend's email from the friendRequests array
    currentUser.friendRequests = currentUser.friendRequests.filter(
      (email) => email !== friendEmail
    );

    // Add the friend's email to the friends array (only if it's not already there)
    if (!currentUser.friends.includes(friendEmail)) {
      currentUser.friends.push(friendEmail);
    }
    if (!friendRequestUser.friends.includes(currentUser.email)) {
      friendRequestUser.friends.push(currentUser.email);
    }

    // Save the updated user document
    await currentUser.save();
    await friendRequestUser.save();

    return response.status(200).json({
      message: "Friend request accepted successfully",
      newFriend: friendRequestUser,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const getFriendRequests = async (request, response, next) => {
  try {
    const userId = request.userId; // Get the userId from the request (from the token)

    // Find the current user and select only the friendRequests array (containing emails)
    const user = await User.findById(userId).select("friendRequests");

    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    const friendRequestEmails = user.friendRequests;

    if (!friendRequestEmails || friendRequestEmails.length === 0) {
      return response.status(200).json({ message: "No friend requests found" });
    }

    // Now find the user details of those who sent the friend requests using their emails
    const friendRequestUsers = await User.find({
      email: { $in: friendRequestEmails },
    }).select("email firstName lastName image"); // Include only the fields you need

    // Sort friendRequestUsers based on their position in friendRequestEmails
    const sortedFriendRequestUsers = friendRequestEmails
      .slice() // Create a shallow copy of the array
      .reverse() // Reverse the array to get the newest requests first
      .map((email) => friendRequestUsers.find((user) => user.email === email)); // Sort by the order in friendRequestEmails

    return response
      .status(200)
      .json({ friendRequests: sortedFriendRequestUsers });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const searchFriendRequests = async (request, response, next) => {
  try {
    const { searchTerm, friendRequests } = request.body;
    const userId = request.userId;

    if (
      searchTerm === undefined ||
      searchTerm === null ||
      friendRequests === undefined ||
      friendRequests === null
    ) {
      return response
        .status(400)
        .json({ error: "searchTerm and friendRequests are required" });
    }

    const sanitizedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(sanitizedSearchTerm, "i");

    const friendRequestEmails = friendRequests.map((request) => request.email);

    // Perform a search only among the users whose emails are in the friendRequestEmails array
    const searchedFriendRequests = await User.find({
      $and: [
        { email: { $in: friendRequestEmails } }, // Only return contacts whose email is in the friendRequestEmails list
        {
          $or: [
            { firstName: regex }, // Match first name
            { lastName: regex }, // Match last name
            { email: regex }, // Match email
            {
              $expr: {
                $regexMatch: {
                  input: { $concat: ["$firstName", " ", "$lastName"] }, // Concatenate first and last name
                  regex: sanitizedSearchTerm,
                  options: "i",
                },
              },
            },
          ],
        },
      ],
    });

    return response.status(200).json({ searchedFriendRequests });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};
