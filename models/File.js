const { Schema, model } = require("mongoose");
const { REQUIRED_STRING } = require("../constants/mongoose-constants");

const fileSchema = new Schema(
  {
    filename: REQUIRED_STRING,
    url: REQUIRED_STRING,
    bucketid: {
      type: Schema.Types.ObjectId,
      ref: "Bucket",
    },
    permission: {
      type: String,
      default: "r",
    },
  },
  { timestamps: true }
);

module.exports = model("File", fileSchema);
