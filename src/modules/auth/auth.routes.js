import { Router } from "express";
import { register, login } from "./auth.controller.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import validate from "../../middlewares/validate.js";
import auditLogger from "../../middlewares/auditLogger.js";


const router = Router();

router.post( "/register", auditLogger("USER_REGISTER"), validate(registerSchema), register, );
router.post("/login", auditLogger("USER_LOGIN"), validate(loginSchema), login);

export default router;
