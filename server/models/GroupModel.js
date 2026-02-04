import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  ],
  messages: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Messages", required: false },
  ],
  lastMessage: {
    type: mongoose.Schema.Types.Mixed, // To store selected fields of the message
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

groupSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

groupSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Group = mongoose.model("Groups", groupSchema);
export default Group;
