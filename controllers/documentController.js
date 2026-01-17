const db = require("../config/database");
const fs = require("fs");
const path = require("path");

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    const { title, description, tags, department, region, project_type } =
      req.body;

    if (!title) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Document title is required",
      });
    }

    // Insert document record
    const [result] = await db.query(
      `INSERT INTO documents 
      (title, description, file_name, file_path, file_size, tags, department, region, project_type, uploader_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        req.file.originalname,
        req.file.path,
        req.file.size,
        tags,
        department,
        region,
        project_type,
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: {
        id: result.insertId,
        title,
        description,
        file_name: req.file.originalname,
        tags,
        department,
        region,
      },
    });
  } catch (error) {
    console.error("Upload document error:", error);
    // Clean up file if database insert fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "Server error during upload",
    });
  }
};

// Get all documents with filters and search
exports.getDocuments = async (req, res) => {
  try {
    const {
      search,
      department,
      region,
      tags,
      uploader_id,
      status,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = `
      SELECT d.*, u.name as uploader_name, u.email as uploader_email,
      r.name as reviewer_name
      FROM documents d 
      LEFT JOIN users u ON d.uploader_id = u.id 
      LEFT JOIN users r ON d.reviewed_by = r.id
      WHERE 1=1
    `;
    const params = [];

    // Get current user to check if reviewer
    const [currentUser] = await db.query(
      "SELECT is_reviewer FROM users WHERE id = ?",
      [req.user.id]
    );
    const isReviewer = currentUser[0]?.is_reviewer;

    // Status filter (for reviewers to filter by status)
    if (status && isReviewer) {
      query += ` AND d.status = ?`;
      params.push(status);
    }

    // Search filter
    if (search) {
      query += ` AND (d.title LIKE ? OR d.description LIKE ? OR d.tags LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Department filter
    if (department) {
      query += ` AND d.department = ?`;
      params.push(department);
    }

    // Region filter
    if (region) {
      query += ` AND d.region = ?`;
      params.push(region);
    }

    // Tags filter
    if (tags) {
      query += ` AND d.tags LIKE ?`;
      params.push(`%${tags}%`);
    }

    // Uploader filter
    if (uploader_id) {
      query += ` AND d.uploader_id = ?`;
      params.push(uploader_id);
    }

    query += ` ORDER BY d.upload_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [documents] = await db.query(query, params);

    res.json({
      success: true,
      count: documents.length,
      documents,
      is_reviewer: isReviewer,
    });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get single document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const [documents] = await db.query(
      `SELECT d.*, u.name as uploader_name, u.email as uploader_email, u.department as uploader_department
       FROM documents d 
       LEFT JOIN users u ON d.uploader_id = u.id 
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      document: documents[0],
    });
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Download document
exports.downloadDocument = async (req, res) => {
  try {
    const [documents] = await db.query("SELECT * FROM documents WHERE id = ?", [
      req.params.id,
    ]);

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const document = documents[0];

    // Check if file exists
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    // Increment download count
    await db.query(
      "UPDATE documents SET download_count = download_count + 1 WHERE id = ?",
      [req.params.id]
    );

    // Track download
    await db.query(
      "INSERT INTO downloads (document_id, user_id) VALUES (?, ?)",
      [req.params.id, req.user.id]
    );

    // Send file
    res.download(document.file_path, document.file_name);
  } catch (error) {
    console.error("Download document error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during download",
    });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const [documents] = await db.query("SELECT * FROM documents WHERE id = ?", [
      req.params.id,
    ]);

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const document = documents[0];

    // Check if user is the uploader
    if (document.uploader_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own documents",
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Delete from database
    await db.query("DELETE FROM documents WHERE id = ?", [req.params.id]);

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get recent documents
exports.getRecentDocuments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get current user to check if reviewer
    const [currentUser] = await db.query(
      "SELECT is_reviewer FROM users WHERE id = ?",
      [req.user.id]
    );
    const isReviewer = currentUser[0]?.is_reviewer;

    // Show all documents to all users
    const query = `
      SELECT d.*, u.name as uploader_name 
      FROM documents d 
      LEFT JOIN users u ON d.uploader_id = u.id 
      ORDER BY d.upload_date DESC 
      LIMIT ?
    `;

    const [documents] = await db.query(query, [limit]);

    res.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Get recent documents error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Review document (approve/reject) - only for reviewers
exports.reviewDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    // Check if user is a reviewer
    const [currentUser] = await db.query(
      "SELECT is_reviewer FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!currentUser[0]?.is_reviewer) {
      return res.status(403).json({
        success: false,
        message: "Only Knowledge Champions can review documents",
      });
    }

    // Validate status
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either approved or rejected",
      });
    }

    // Check if document exists
    const [documents] = await db.query("SELECT * FROM documents WHERE id = ?", [
      id,
    ]);
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Update document status
    await db.query(
      "UPDATE documents SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_comment = ? WHERE id = ?",
      [status, req.user.id, comment || null, id]
    );

    res.json({
      success: true,
      message: `Document ${status} successfully`,
    });
  } catch (error) {
    console.error("Review document error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get pending documents (for reviewers)
exports.getPendingDocuments = async (req, res) => {
  try {
    // Check if user is a reviewer
    const [currentUser] = await db.query(
      "SELECT is_reviewer FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!currentUser[0]?.is_reviewer) {
      return res.status(403).json({
        success: false,
        message: "Only Knowledge Champions can access pending documents",
      });
    }

    const [documents] = await db.query(
      `SELECT d.*, u.name as uploader_name, u.email as uploader_email, u.department as uploader_department
       FROM documents d 
       LEFT JOIN users u ON d.uploader_id = u.id 
       WHERE d.status = 'pending'
       ORDER BY d.upload_date ASC`
    );

    res.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get pending documents error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
