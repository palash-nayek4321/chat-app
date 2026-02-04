import jwt from "jsonwebtoken";

export const verifyToken = (request, response, next) => {
  const token = request.cookies.jwt;

  if (!token) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_KEY, async (error, payload) => {
    if (error) {
      return response.status(403).json({ error: "Token is invalid" });
    }
    request.userId = payload.userId;
    next();
  });
};
