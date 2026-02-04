import mongoose from "mongoose";
import Group from "../models/GroupModel.js";
import User from "../models/UserModel.js";

export const createGroup = async (request, response, next) => {
  try {
    const { name, members } = request.body;

    console.log("members before:");
    console.log(members);

    const userId = request.userId;

    const admin = await User.findById(userId);

    if (!admin) {
      return response.status(400).json({ error: "Admin user not found" });
    }

    // // add userId to members
    // if (!members || members.length === 0) {
    //   // members = [userId];
    //   members.unshift(userId);
    // } else {
    members.unshift(userId);
    // }

    console.log("members after:");
    console.log(members);

    const validMembers = await User.find({ _id: { $in: members } }).select(
      "_id"
    );

    if (validMembers.length !== members.length) {
      return response
        .status(400)
        .json({ error: "One or more members are not valid users" });
    }

    console.log("valid members:");
    console.log(validMembers);

    const newGroup = new Group({
      name,
      // members,
      members: validMembers.map((member) => member._id), // Ensure members have valid user IDs
    });

    await newGroup.save();

    return response.status(201).json({ group: newGroup });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const getUserGroups = async (request, response, next) => {
  try {
    const userId = request.userId;

    const groups = await Group.find({
      members: userId,
    }).sort({ updatedAt: -1 });

    return response.status(201).json({ groups });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const getGroupsInCommon = async (request, response, next) => {
  try {
    // console.log("in");
    const userId = request.userId;
    // const { contactId } = request.body;
    const { contactId } = request.params;

    const groups = await Group.find({
      members: { $all: [userId, contactId] },
    }).sort({ updatedAt: -1 });

    return response.status(201).json({ groups });
  } catch (error) {
    // console.log(error);
    // return response.status(500).json({ error: error.message });
    console.log("ey");
    return response.status(500).json({ error: "ey" });
  }
};

export const getGroupMembers = async (request, response, next) => {
  try {
    const { groupId } = request.params; // Get the group ID from request parameters
    const userId = request.userId; // Get the current user's ID

    // Find the group and populate the members' data
    const group = await Group.findById(groupId).populate(
      "members",
      "firstName lastName _id"
    );

    if (!group) {
      return response.status(404).json({ error: "Group not found" });
    }

    // Get the members and convert to an array
    let members = group.members;

    // Rearrange the members to put the current user at the start
    const currentUser = members.find(
      (member) => member._id.toString() === userId
    );
    if (currentUser) {
      members = [
        currentUser,
        ...members.filter((member) => member._id.toString() !== userId),
      ];
    }

    // Map to get the required fields (firstName and lastName)
    const formattedMembers = members.map((member) => ({
      firstName: member.firstName,
      lastName: member.lastName,
      id: member._id,
    }));

    return response.status(200).json({ members: formattedMembers });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const getGroupMessages = async (request, response, next) => {
  // console.log("in get chan msg");

  try {
    // console.log("in get chan msg");
    const { groupId } = request.params;
    const userId = request.userId;
    // console.log("cha id: " + groupId);
    const group = await Group.findById(groupId).populate({
      path: "messages",
      match: { deletedFor: { $nin: [userId] } },
      populate: {
        path: "sender",
        select: "firstName lastName email _id image color",
      },
    });

    if (!group) {
      return response.status(404).json({ error: "Group not found" });
    }

    const messages = group.messages;

    return response.status(201).json({ messages });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const searchGroups = async (request, response, next) => {
  try {
    const { searchTerm, groups } = request.body;

    if (
      searchTerm === undefined ||
      searchTerm === null ||
      groups === undefined ||
      groups === null
    ) {
      return response
        .status(400)
        .json({ error: "searchTerm and groups are required" });
    }

    const sanitizedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(sanitizedSearchTerm, "i");

    const userGroups = groups.map((group) => group._id);

    // Perform a search only among the groups whose ids are in the userGroups array
    const searchedGroups = await Group.find({
      $and: [
        { _id: { $in: userGroups } }, // Only return groups whose ids is in the userGroups list
        { name: regex }, // Match group name
      ],
    });

    return response.status(200).json({ searchedGroups });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};

export const getGroupFiles = async (request, response, next) => {
  try {
    const { groupId } = request.params;
    const userId = request.userId;

    // Fetch the group and populate messages with a filter on messageType
    const group = await Group.findById(groupId).populate({
      path: "messages",
      match: {
        messageType: "file",
        deletedFor: { $nin: [userId] },
      }, // Only include file messages not deleted for the user
      populate: {
        path: "sender",
        select: "firstName lastName email _id image color",
      },
    });

    if (!group) {
      return response.status(404).json({ error: "Group not found" });
    }

    const files = group.messages; // This will contain only messages with messageType "file"

    return response.status(201).json({ files: files.reverse() });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error: error.message });
  }
};
