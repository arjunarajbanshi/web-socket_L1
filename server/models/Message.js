import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, trim: true, maxlength: 30 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true } // adds createdAt + updatedAt
);

export default mongoose.model("Message", messageSchema);
