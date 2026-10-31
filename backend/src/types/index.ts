export type Role = "admin" | "lawyer" | "customer";
export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
}
declare global {
  namespace Express {
    interface Request {
      actor?: Profile;
      accessToken?: string;
    }
  }
}
