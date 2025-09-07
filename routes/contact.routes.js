const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth"); // JWT authentication middleware
const contactController = require("../controllers/contact.controller");
const multer = require("multer");

// ================= CONTACT ROUTES =================
// All routes protected by JWT middleware

// Create a new contact (with optional picture)
router.post("/", auth, upload.single("picture"), contactController.createContact);

// Get all contacts (supports pagination & search)
router.get("/", auth, contactController.getContacts);

// Get a single contact by ID
router.get("/:id", auth, contactController.getContact);

// Update contact by ID (with optional picture)
router.put("/:id", auth, upload.single("picture"), contactController.updateContact);

// Delete a contact by ID
router.delete("/:id", auth, contactController.deleteContact);

// Bulk delete contacts (by IDs or search term)
router.post("/bulk-delete", auth, contactController.bulkDeleteContacts);

// Bulk upload contacts (CSV/Excel file)
router.post("/bulk-upload", auth, upload.single("file"), contactController.bulkUploadContacts);

// Export contacts (CSV or Excel)
router.get("/export", auth, contactController.exportContacts);

module.exports = router;
