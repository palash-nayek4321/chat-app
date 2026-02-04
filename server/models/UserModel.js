import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  salt: {
    type: String,
    required: false,
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  color: {
    type: Number,
    required: false,
  },
  profileSetup: {
    type: Boolean,
    default: false,
  },
  friendRequests: [
    {
      type: String,
      ref: "Users",
    },
  ],
  friends: [
    {
      type: String,
      ref: "Users",
    },
  ],
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: null,
  },
  readReceiptsEnabled: {
    type: Boolean,
    default: true,
  },
});

// userSchema.pre("save", async function (next) {
//   const salt = await genSalt(10);
//   const pepper = process.env.PEPPER_STRING;
//   this.password = await bcrypt.hash(salt + this.password + pepper, 10);
//   this.salt = salt;
//   next();
// });

const User = mongoose.model("Users", userSchema);

export default User;
