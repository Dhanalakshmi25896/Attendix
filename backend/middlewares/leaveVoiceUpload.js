const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads", "leave-voice");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

function audioOnly(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Only audio uploads are allowed for voice note"));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: audioOnly,
});

module.exports = {
  uploadDir,
  leaveVoiceUpload: upload.single("voice_note"),
};
