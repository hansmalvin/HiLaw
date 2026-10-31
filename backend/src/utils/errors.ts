export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function check(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "P0001") throw new ApiError(409, error.message);
  if (error.code === "23505")
    throw new ApiError(
      409,
      "Data sudah terdaftar atau pengajuan sedang pending.",
    );
  if (error.code === "42501") throw new ApiError(403, "Akses ditolak.");
  // Supabase messages may contain internal schema or storage details.
  throw new ApiError(502, "Layanan penyimpanan sedang bermasalah.");
}
