import jwt from "jsonwebtoken";

// !!! PRODUCTION NOTE !!!
// Set a real, secret, random value for JWT_SECRET in your .env file before
// deploying. Falling back to a dev default keeps the hackathon demo running
// even if .env hasn't been created yet, but it is NOT secure for real use.
const usingDevSecret = !process.env.JWT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || "catos-dev-secret-change-me";
const TOKEN_TTL = "30d";

export const jwtSecretIsDevDefault = usingDevSecret;

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated." });
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}
