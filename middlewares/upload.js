const multer = require("multer");

// Memory storage (file stays in RAM)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (allowedTypes.test(ext)) cb(null, true);
    else cb(new Error("Only images are allowed (jpeg, jpg, png, gif, webp)"));
  },
});

module.exports = upload; // export directly
