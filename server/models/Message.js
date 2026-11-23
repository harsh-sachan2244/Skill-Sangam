import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: "Internship", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Message", messageSchema);