import express from "express";
import multer from "multer";
import messageController from "../controllers/message.controller.js";
import { authenticate } from "../middleware/auth.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();
const upload = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All message routes require authentication
const auth = authenticate([ROLES.STUDENT, ROLES.ADMIN]);

router.get("/support-admins", auth, messageController.getSupportAdmins);
router.get("/conversations", auth, messageController.getConversations);
router.post("/conversations", auth, messageController.createConversation);
router.get("/conversations/:conversationId/messages", auth, messageController.getMessages);
router.post("/conversations/:conversationId/upload", auth, upload.single('file'), messageController.uploadFile);
router.post("/send", auth, messageController.sendMessage);

export default router;
