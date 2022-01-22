const crypto = require("crypto");
const express = require("express");
const axios = require("axios");

const fs = require("fs");
const path = require("path");
const router = express.Router();

const {
  UNAUTHORIZED,
  OK,
  INTERNAL_SERVER_ERROR,
} = require("../constants/response-constants");
const Bucket = require("../models/Bucket");
const File = require("../models/File");
const {
  createFolder,
  PUBLIC_PATH,
  dataUrlToFile,
} = require("../utils/file-utils");
const {
  checkStorageAccess,
  saveFileRecord,
  getBucketFolder,
} = require("../services/StorageServices");
const { queryToMongoFilter } = require("../utils/mongoose-utils");

router.get("/buckets/:id", async (req, res) => {
  try {
    // const response = await axios.post(`${process.env.IAM}/auth/check-token`, {
    //   token: req.body.token,
    // });
    // if (response.data.code != 200 || response.data.data.role != "superadmin") {
    //   return res.status(401).json(UNAUTHORIZED);
    // }
    const bucket = await checkStorageAccess(req.params.id, req.query.key);
    if (!bucket) {
      return res.status(401).json(UNAUTHORIZED);
    }

    const filter = {
      status: { $ne: 0 },
      bucketid: req.params.id,
    };

    const search = req.query.search;
    const page = req.query.page;
    const perpage = req.query.perpage;

    if (search) {
      filter.$text = { $search: search };
    }

    queryToMongoFilter(req.query, filter);

    let data = [];

    const total = await File.find(filter).countDocuments();
    let pagination = {};
    if (page && perpage) {
      pagination = { page, perpage };
      const offset = (page - 1) * perpage;
      data = await File.find(filter).skip(offset).limit(perpage);
      pagination.pagecounts = Math.ceil(total / perpage);
    } else {
      data = await File.find(filter);
    }

    return res.json({ ...OK, data, total, ...pagination });
  } catch (err) {
    console.log(err);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
});

router.post("/buckets", async (req, res) => {
  try {
    const response = await axios.post(`${process.env.IAM}/auth/check-token`, {
      token: req.body.token,
    });
    if (response.data.code != 200 || response.data.data.role != "superadmin") {
      return res.status(401).json(UNAUTHORIZED);
    }
    const accesskey = crypto.randomBytes(16).toString("hex");
    // const hashedkey = await bcrypt.hash(accesskey, 10);
    const bucket = new Bucket({
      bucketname: req.body.bucketname,
      accesskey: accesskey,
      appid: req.body.appid,
      userid: response.data.data.userid,
    });
    await bucket.save();
    createFolder(`${bucket.bucketname}_${bucket._id}`);

    res.json({
      ...OK,
      bucketname: bucket.bucketname,
      id: bucket._id,
      key: accesskey,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
});

router.post("/upload-dataurl", async (req, res) => {
  try {
    const bucket = await checkStorageAccess(req.query.id, req.query.key);
    if (!bucket) {
      return res.status(401).json(UNAUTHORIZED);
    }
    const f = await saveFileRecord(bucket, req.body.filename);
    dataUrlToFile(
      req.body.file,
      path.join(getBucketFolder(bucket), f.filename)
    );
    res.json({ ...OK, url: f.url });
  } catch (err) {
    console.log(err);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
});

router.post("/upload-file", async (req, res) => {
  try {
    const bucket = await checkStorageAccess(req.query.id, req.query.key);
    if (!bucket) {
      return res.status(401).json(UNAUTHORIZED);
    }

    if (req.busboy) {
      req.busboy.on("file", (name, file, info) => {
        console.log(`Upload of '${info.filename}' started`);

        saveFileRecord(bucket, info.filename).then((f) => {
          // Create a write stream of the new file
          const fstream = fs.createWriteStream(
            path.join(PUBLIC_PATH, getBucketFolder(bucket), f.filename)
          );
          // Pipe it trough
          file.pipe(fstream);

          // On finish of the upload
          fstream.on("close", () => {
            console.log(`Upload of '${info.filename}' finished`);
            res.json({ ...OK, url: f.url });
          });
        });
      });
      req.pipe(req.busboy);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(INTERNAL_SERVER_ERROR);
  }
});

module.exports = router;
