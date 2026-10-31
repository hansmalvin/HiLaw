import type { RequestHandler } from "express";
import { database } from "../config/supabase.js";
import { ApiError, check } from "../utils/errors.js";
import type { Role } from "../types/index.js";
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.get("authorization");
    if (!header?.startsWith("Bearer "))
      throw new ApiError(401, "Silakan masuk terlebih dahulu.");
    const token = header.slice(7);
    const { data, error } = await database.auth.getUser(token);
    if (error || !data.user)
      throw new ApiError(401, "Sesi tidak valid atau kedaluwarsa.");
    const profile = await database
      .from("profiles")
      .select("id,full_name,email,phone,role,avatar_url")
      .eq("id", data.user.id)
      .single();
    check(profile.error);
    if (!profile.data) throw new ApiError(403, "Profil tidak tersedia.");
    req.actor = profile.data;
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
};
export const roles =
  (...allowed: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.actor || !allowed.includes(req.actor.role))
      return next(new ApiError(403, "Role tidak diizinkan."));
    next();
  };
