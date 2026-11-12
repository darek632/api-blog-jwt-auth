const { Router } = require("express");
const authController = require("../controllers/authController");
const authRouter = Router();
const { requireAuth } = require("../middleware/auth");

// log in still using passport local strategy
// log out is frontend removing the jwt token
// the get routes are also for front end. 


authRouter.get("/me", requireAuth, (req,res) => res.json(req.user));

authRouter.post("/auth/sign-up", authController.signUpPost);

authRouter.post("/auth/log-in", authController.logInPost);


module.exports = authRouter;