// Rate and availability remain demo-only until the consultation backend exists.
export function lawyerPreferences(id: string): {
  rate: number;
  online: boolean;
} {
  try {
    const value = JSON.parse(
      localStorage.getItem("hilaw-lawyer-preferences-" + id) ?? "null",
    );
    if (
      value &&
      Number.isSafeInteger(value.rate) &&
      value.rate >= 1 &&
      value.rate <= 10000 &&
      typeof value.online === "boolean"
    )
      return value;
  } catch {}
  return { rate: 50, online: true };
}
export function saveLawyerPreferences(
  id: string,
  rate: number,
  online: boolean,
) {
  if (!Number.isSafeInteger(rate) || rate < 1 || rate > 10000)
    throw new Error("Tarif harus 1-10.000 Coins.");
  localStorage.setItem(
    "hilaw-lawyer-preferences-" + id,
    JSON.stringify({ rate, online }),
  );
}
