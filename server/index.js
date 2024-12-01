const express = require("express");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use("/", express.static("public"));
app.use(fileUpload());
app.listen(8082);
app.post("/extract-text", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }
  pdfParse(req.files.pdfFile).then((data) => {
    res.send(data.text);
  });
});
