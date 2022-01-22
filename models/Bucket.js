const { Schema, model } = require("mongoose");
const { REQUIRED_STRING } = require("../constants/mongoose-constants");

const bucketSchema = new Schema(
  {
    accesskey: REQUIRED_STRING,
    appid: REQUIRED_STRING,
    userid: REQUIRED_STRING,
    bucketname: REQUIRED_STRING,
  },
  { timestamps: true }
);

module.exports = model("Bucket", bucketSchema);
