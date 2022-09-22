const params = new URLSearchParams(window.location.search);
const fileName = params.get("fileName");

if (fileName) {
  editDocument(fileName);
} else {
  listDocuments();
}

function listDocuments() {
  // Hide the editor placeholder
  document.getElementById("placeholder").style.display = "none";
  // Remove old list
  const oldList = document.getElementById("documents-list");
  oldList && oldList.remove();
  // Create new container
  const documentsHtml = document.getElementById("documents");
  const docsListHtml = document.createElement("div");
  docsListHtml.id = "documents-list";

  documentsHtml.appendChild(docsListHtml);

  const req = new XMLHttpRequest();

  req.addEventListener("load", function (evt) {
    const docs = JSON.parse(this.response);

    docs.forEach(doc => {
      addDocumentHtml(doc);
    });
  });

  req.open("GET", "/documents");
  req.send();
}

function addDocumentHtml(fileName) {
  const docsListHtml = document.getElementById("documents-list");

  const docElement = document.createElement("div");
  docElement.id = fileName;
  docElement.textContent = fileName;
  docElement.setAttribute("class", "document");

  docElement.onclick = () => {
    openDocument(fileName);
  }

  const deleteElement = document.createElement("span");
  deleteElement.textContent = "X";
  deleteElement.setAttribute("class", "delete-doc");

  deleteElement.onclick = evt => {
    evt.stopPropagation();
    evt.preventDefault();
    deleteDocument(fileName);
  }

  docElement.appendChild(deleteElement);
  docsListHtml.appendChild(docElement);
}

function openDocument(fileName) {
  const url = "/?fileName=" + fileName;
  open(url, "_blank");
}

function createDocument(extension) {
  const name = prompt("What's the name of your new document?");
  // const fileName = name + "." + extension;
  const fileName = name + extension;

  const req = new XMLHttpRequest();

  req.addEventListener("load", function (evt) {
    if (this.status === 200) {
      addDocumentHtml(fileName);
      return;
    }

    alert("Could not create " + fileName);
  });

  req.open("POST", "/create?fileName=" + fileName);
  req.send();
}

async function editDocument(fileName) {
  document.getElementById("documents").style.display = "none";

  const extension = fileName.substring(fileName.lastIndexOf(".") + 1);
  const documentType = getDocumentType(extension);
  const documentKey = await generateKey(fileName);

  console.log(documentKey);
  console.log(documentType)
  console.log("http://localhost:3000/documents/" + fileName)

  new DocsAPI.DocEditor("placeholder", {
    document: {
      fileType: extension,
      key: documentKey,
      title: fileName,
      url: "http://192.168.176.1:3000/documents/" + fileName,
    },
    documentType,
    editorConfig: {
      callbackUrl: "http://192.168.176.1:3000/track?fileName=" + fileName,
      customization: {
        forcesave: true
      }
    },
    height: "100%",
    width: "100%",
  });
}

function generateKey(fileName) {
  return new Promise(resolve => {
    const req = new XMLHttpRequest();

    req.addEventListener("load", function (evt) {
      const backups = JSON.parse(this.response);
      const backupName = backups[0];
      const key = backupName ? backupName.substring(0, backupName.indexOf(".")) : new Date().getTime();
      resolve(String(key));
    });

    req.open("GET", "/backups?fileName=" + fileName);
    req.send();
  });
}

function getDocumentType(extension) {
  const documentTypes = {
    text: ["doc", "docx", "docm", "dot", "dotx", "dotm", "odt", "fodt", "ott", "rtf", "txt", "html", "htm", "mht", "pdf", "djvu", "fb2", "epub", "xps"],
    spreadsheet: ["xls", "xlsx", "xlsm", "xlt", "xltx", "xltm", "ods", "fods", "ots", "csv"],
    presentation: ["pps", "ppsx", "ppsm", "ppt", "pptx", "pptm", "pot", "potx", "potm", "odp", "fodp", "otp"],
  }

  if (documentTypes.text.indexOf(extension) >= 0) {
    return "text";
  }
  if (documentTypes.spreadsheet.indexOf(extension) >= 0) {
    return "spreadsheet";
  }
  if (documentTypes.presentation.indexOf(extension) >= 0) {
    return "presentation";
  }
}

function deleteDocument(fileName) {
  const canContinue = confirm("Are you sure you want to delete " + fileName + "?");

  if (!canContinue) {
    return;
  }

  const req = new XMLHttpRequest();

  req.addEventListener("load", function (evt) {
    if (this.status === 200) {
      return removeDocumentHtml(fileName);
    }

    alert("Could not delete " + fileName);
  });

  req.open("DELETE", "/delete?fileName=" + fileName);
  req.send();
}

function removeDocumentHtml(fileName) {
  const el = document.getElementById(fileName);
  el && el.remove();
}
