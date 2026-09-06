
const documentService = require("../services/document.service");
const { processDocumentWithAI } = require("../services/ai.service");
const { createAuditLog } = require("../services/audit.service");
const {
  isAllowedDocumentType,
  isValidUUID,
} = require("../utils/validators");


/**
 * POST /api/documents/upload
 *
 * Upload a new land record document.
 */
const uploadDocument = async (req, res, next) => {
  try {
    // Check uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Document file is required",
      });
    }

    const {
      document_type,
      language = "unknown",
      is_handwritten = false,
      quality = "medium",
    } = req.body;

    // Validate document type
    if (!document_type) {
      return res.status(400).json({
        success: false,
        message: "document_type is required",
      });
    }

    if (!isAllowedDocumentType(document_type)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid document_type. Allowed types: ROR, MUTATION, REGISTRATION, HANDWRITTEN, MAP",
      });
    }

    // Convert handwritten value safely
    const handwritten =
      is_handwritten === true ||
      is_handwritten === "true";

    // Generate unique document code
    const documentCode = `DOC-${Date.now()}`;

    // Save document using service layer
    const document = await documentService.createDocument({
      documentCode,
      documentType: document_type,
      fileName: req.file.originalname,
      filePath: req.file.path,
      language,
      isHandwritten: handwritten,
      quality,
      uploadedBy: req.user.id,
    });

    // Create audit record
    await createAuditLog({
      userId: req.user.id,
      documentId: document.id,
      action: "DOCUMENT_UPLOADED",
      entityType: "DOCUMENT",
      entityId: document.id,
      newValue: {
        document_code: documentCode,
        file_name: req.file.originalname,
        document_type,
        language,
        is_handwritten: handwritten,
        quality,
      },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        document,
      },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/documents
 *
 * Get all uploaded documents.
 */
const getDocuments = async (req, res, next) => {
  try {
    const documents = await documentService.findAllDocuments();

    return res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/documents/:id
 *
 * Get complete document details including
 * associated land record information.
 */
const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const document = await documentService.findDocumentById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * POST /api/documents/:id/process
 *
 * Send document to Python/FastAPI AI service
 * for preprocessing, OCR, extraction and
 * document understanding.
 */
const processDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    // Find document
    const document = await documentService.findDocumentById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Prevent duplicate processing
    if (document.processing_status === "processing") {
      return res.status(409).json({
        success: false,
        message: "Document is already being processed",
      });
    }

    // Update status → processing
    await documentService.updateProcessingStatus(
      id,
      "processing"
    );

    try {
      // Call Python/FastAPI AI service
      const aiResult = await processDocumentWithAI(document);

      // Update status → completed
      await documentService.updateProcessingStatus(
        id,
        "completed",
        new Date()
      );

      // Audit successful processing
      await createAuditLog({
        userId: req.user.id,
        documentId: id,
        action: "DOCUMENT_PROCESSED",
        entityType: "DOCUMENT",
        entityId: id,
        newValue: {
          processing_status: "completed",
        },
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: "Document processed successfully",
        data: {
          document_id: id,
          ai_result: aiResult,
        },
      });
    } catch (aiError) {
      // Update status → failed
      await documentService.updateProcessingStatus(
        id,
        "failed"
      );

      // Audit failed processing
      await createAuditLog({
        userId: req.user.id,
        documentId: id,
        action: "DOCUMENT_PROCESSING_FAILED",
        entityType: "DOCUMENT",
        entityId: id,
        newValue: {
          processing_status: "failed",
          error: aiError.message,
        },
        ipAddress: req.ip,
      });

      throw aiError;
    }
  } catch (error) {
    next(error);
  }
};


module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  processDocument,
};

