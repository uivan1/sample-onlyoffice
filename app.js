const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const fs = require('fs');
const syncRequest = require('sync-request');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));
app.use("/public", express.static(__dirname + '/public'));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

// documents
app.get("/documents", (req, res) => {
  const docsPath = path.join(__dirname, "public/documents");
  const docsPaths = fs.readdirSync(docsPath);

  const fileNames = [];

  docsPaths.forEach(filePath => {
    const fileName = path.basename(filePath);
    fileNames.push(fileName);
  });

  res.send(fileNames);
});
// create
app.post("/create", async (req, res) => {
  
  const ext = path.extname(req.query.fileName);
  const fileName = req.query.fileName;

  const samplePath = path.join(__dirname, "public/samples", "new" + ext);
  const newFilePath = path.join(__dirname, "public/documents", fileName);

  // Copy the sample file to the documents folder with its new name.
  try {
    fs.copyFileSync(samplePath, newFilePath);
    res.sendStatus(200);
  } catch (e) {
    console.log(e)
    res.sendStatus(400);
  }
});
// delete
app.delete("/delete", (req, res) => {
  const fileName = req.query.fileName;
  const filePath = path.join(__dirname, "public/documents", fileName);

  try {
    fs.unlinkSync(filePath);
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(400);
  }
});
// track
app.post("/track", async (req, res) => {
  const fileName = req.query.fileName;
  console.log('here track')
  console.log(req.body.hasOwnProperty("status"))
  console.log('status', req.body.status)
  
  const backupFile = filePath => {
    const time = new Date().getTime();
    const ext = path.extname(filePath);
    const backupFolder = path.join(__dirname, "public/backups", fileName + "-history");
    // Create the backups folder if it doesn't exist
    !fs.existsSync(backupFolder) && fs.mkdirSync(backupFolder);

    // Remove previous backup if any
    const previousBackup = fs.readdirSync(backupFolder)[0];
    previousBackup && fs.unlinkSync(path.join(backupFolder, previousBackup));

    const backupPath = path.join(backupFolder, time + ext);

    fs.copyFileSync(filePath, backupPath);
  }

  const updateFile = async (response, body, path) => {
    console.log('update file', body.status)
    // prev 2
    if (body.status == 2) {
      backupFile(path);
      const file = syncRequest("GET", body.url);
      fs.writeFileSync(path, file.getBody());
    }

    response.write("{\"error\":0}");
    response.end();
  }

  const readbody = (request, response, path) => {
    const content = "";
    request.on("data", function (data) {
      content += data;
    });
    request.on("end", function () {
      const body = JSON.parse(content);
      updateFile(response, body, path);
    });
  }

  if (req.body.hasOwnProperty("status")) {
    console.log('Holo ????')
    const filePath = path.join(__dirname, "public/documents", fileName);
    updateFile(res, req.body, filePath);
  } else {
    readbody(req, res, filePath);
  }
});

app.get("/backups", (req, res) => {
  const fileName = req.query.fileName;
  const backupsPath = path.join(__dirname, "public/backups", fileName + "-history");

  if (!fs.existsSync(backupsPath)) {
    return res.send([]);
  }

  const backupsPaths = fs.readdirSync(backupsPath);

  const fileNames = [];

  backupsPaths.forEach(filePath => {
    const fileName = path.basename(filePath);
    fileNames.push(fileName);
  });

  res.send(fileNames);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`App listening on http://localhost:${port}`));
