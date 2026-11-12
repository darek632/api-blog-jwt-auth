const passport = require("passport");

//actual authentication
const requireAuth = passport.authenticate("jwt", { session: false });

//2nd line for checking if author
function requireAuthor(req, res, next) {
  if (!req.user || !req.user.isAuthor) {
    return res.status(403).json({ error: "Author access only" });
  }
  next();
}

module.exports = { requireAuth, requireAuthor };
