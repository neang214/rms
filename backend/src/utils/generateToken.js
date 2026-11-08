import jwt from "jsonwebtoken";
 
export const JWT_SECRET = process.env.JWT_SECRET || "zoom_rms_default_jwt_secret_key";

export const generateToken = (user, res) => {
  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
  const token = jwt.sign({ 
      userId:   user.user_id,
      username: user.username,
      role:     user.role,
   }, JWT_SECRET, {
    expiresIn: "1d",
  });
 
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });
 
  return token;
};
 