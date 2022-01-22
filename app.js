require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const busboy = require("connect-busboy");

const app = express();

const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(busboy());

app.use("/storage", (req, res, next) => {
  //   if (!req.query.token || req.query.token != "pass") {
  //     throw Error("unauthorized");
  //   }
  next();
});
app.use("/storage", express.static("public"));

app.use("/storage/api", require("./controllers/StorageController"));

mongoose.connect(process.env.DB_CONNECTION).then(() => {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
});
