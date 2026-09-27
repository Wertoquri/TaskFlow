const jwt = require("jsonwebtoken");
const { getQuery } = require("../db");
const authenticate = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const rows = await getQuery(
        "SELECT token_version FROM users WHERE id = ?",
        [decoded.id],
      );
      if (!rows.length || rows[0].token_version !== (decoded.v ?? 0)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.user = decoded;
      next();
    } catch (error) {
      console.error("Authentication lookup failed:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
};
module.exports = authenticate;
