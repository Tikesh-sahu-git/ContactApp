const Contact = require("../models/Contact");
const { v2: cloudinary } = require("cloudinary");
const csvParser = require("csv-parser");
const XLSX = require("xlsx");
const stream = require("stream");
const { Parser } = require("json2csv");

// Helper: Upload buffer to Cloudinary
const streamUpload = (buffer, folder = "contacts") =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    uploadStream.end(buffer);
  });

// Escape regex special characters
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ================= CREATE CONTACT =================
exports.createContact = async (req, res) => {
  try {
    const data = { ...req.body, owner: req.user.id };

    if (req.file) {
      try {
        const result = await streamUpload(req.file.buffer);
        data.picture = result.secure_url;
      } catch (err) {
        console.error("Cloudinary Upload Error:", err.message);
        return res.status(500).json({ error: "Failed to upload picture" });
      }
    }

    const contact = await Contact.create(data);
    res.status(201).json(contact);
  } catch (err) {
    console.error("Create Contact Error:", err.message);
    res.status(500).json({ error: "Failed to create contact" });
  }
};

// ================= GET CONTACTS (Paginated + Search) =================
exports.getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = { owner: req.user.id };

    if (search) {
      const term = escapeRegex(search);
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
        { phone: { $regex: term, $options: "i" } },
      ];
    }

    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10), sort: { createdAt: -1 } };
    const contacts = await Contact.paginate(query, options);
    res.json(contacts);
  } catch (err) {
    console.error("Get Contacts Error:", err.message);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

// ================= GET SINGLE CONTACT =================
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, owner: req.user.id });
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json(contact);
  } catch (err) {
    console.error("Get Contact Error:", err.message);
    res.status(500).json({ error: "Failed to fetch contact" });
  }
};

// ================= UPDATE CONTACT =================
exports.updateContact = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (req.file) {
      try {
        const result = await streamUpload(req.file.buffer);
        updates.picture = result.secure_url;
      } catch (err) {
        console.error("Cloudinary Upload Error:", err.message);
        return res.status(500).json({ error: "Failed to upload picture" });
      }
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updates,
      { new: true }
    );

    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json(contact);
  } catch (err) {
    console.error("Update Contact Error:", err.message);
    res.status(500).json({ error: "Failed to update contact" });
  }
};

// ================= DELETE CONTACT =================
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json({ message: "Contact deleted successfully" });
  } catch (err) {
    console.error("Delete Contact Error:", err.message);
    res.status(500).json({ error: "Failed to delete contact" });
  }
};

// ================= BULK DELETE =================
exports.bulkDeleteContacts = async (req, res) => {
  try {
    const { ids, search } = req.body;
    const query = { owner: req.user.id };

    if (ids?.length) query._id = { $in: ids };
    else if (search) {
      const term = escapeRegex(search);
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
        { phone: { $regex: term, $options: "i" } },
      ];
    } else return res.status(400).json({ message: "Provide either ids[] or search term" });

    const result = await Contact.deleteMany(query);
    res.json({ message: "Contacts deleted successfully", deletedCount: result.deletedCount });
  } catch (err) {
    console.error("Bulk Delete Error:", err.message);
    res.status(500).json({ error: "Failed to delete contacts" });
  }
};

// ================= BULK UPLOAD (CSV/Excel) =================
exports.bulkUploadContacts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    let contacts = [];

    if (req.file.originalname.endsWith(".csv")) {
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);
      contacts = await new Promise((resolve, reject) => {
        const results = [];
        bufferStream.pipe(csvParser())
          .on("data", row => {
            if (row.name) results.push({
              name: row.name.trim(),
              email: row.email?.trim() || "",
              phone: row.phone?.trim() || "",
              owner: req.user.id
            });
          })
          .on("end", () => resolve(results))
          .on("error", reject);
      });
    } else if (req.file.originalname.match(/\.(xlsx|xls)$/)) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      contacts = sheet
        .filter(row => row.name)
        .map(row => ({
          name: row.name.trim(),
          email: row.email?.trim() || "",
          phone: row.phone?.trim() || "",
          owner: req.user.id
        }));
    } else return res.status(400).json({ message: "Only CSV or Excel files allowed" });

    const savedContacts = await Contact.insertMany(contacts);
    res.json({ message: "Bulk upload successful", count: savedContacts.length });
  } catch (err) {
    console.error("Bulk Upload Error:", err.message);
    res.status(500).json({ error: "Failed to bulk upload contacts" });
  }
};

// ================= EXPORT CONTACTS (CSV/Excel) =================
exports.exportContacts = async (req, res) => {
  try {
    const { format = "csv" } = req.query;
    const contacts = await Contact.find({ owner: req.user.id }).lean();

    if (!contacts.length) return res.status(404).json({ message: "No contacts found" });

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(contacts);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Disposition", 'attachment; filename="contacts.xlsx"');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(buffer);
    } else {
      const fields = ["name", "email", "phone", "createdAt"];
      const csv = new Parser({ fields }).parse(contacts);
      res.setHeader("Content-Disposition", 'attachment; filename="contacts.csv"');
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    }
  } catch (err) {
    console.error("Export Contacts Error:", err.message);
    res.status(500).json({ error: "Failed to export contacts" });
  }
};
