export const getOrCreateUDID = (): string => {
  if (typeof window === "undefined") return "";
  let udid = localStorage.getItem("absensi_udid");
  if (!udid) {
    // Generate standard UUID v4 uppercase
    udid = "xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"
      .replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })
      .toUpperCase();
    localStorage.setItem("absensi_udid", udid);
  }
  return udid;
};
