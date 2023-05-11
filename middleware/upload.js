import multer from "multer";

// CONFIGURING MULTER STORAGE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // SETTING UP DIRECTORY
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + ext[1]);
  },
});
// BEEP BEEP my changes

const upload = multer({ storage: storage });

export default upload;
