const Bucket = require("../models/Bucket");
const { v4 } = require("uuid");
const File = require("../models/File");

exports.checkStorageAccess = async (id, key) => {
  if (!id || !key) {
    return null;
  }
  const bucket = await Bucket.findById(id);
  if (!bucket) {
    return null;
  }

  if (key != bucket.accesskey) {
    return null;
  }
  return bucket;
};

exports.getBucketFolder = (bucket) => {
  if (!bucket) {
    return "";
  }
  return `${bucket.bucketname}_${bucket._id}`;
};

exports.saveFileRecord = async (bucket, filename) => {
  const fileid = v4();
  const bucket_folder = this.getBucketFolder(bucket);
  const fname = `${fileid}_${filename}`;
  const file = new File({
    filename: fname,
    url: `/storage/${bucket_folder}/${fname}`,
  });
  await file.save();
  return file;
};
