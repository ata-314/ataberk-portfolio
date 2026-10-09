import { createHmac } from "node:crypto";

// Salted hash of the network (IPv4 address, or the /64 an IPv6 home or office shares).
// Only ever compared for equality; the IP itself is never stored.
export function networkOf(request: Request) {
  const salt = process.env.IP_SALT;
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (!salt || !ip) return null;
  const net = ip.includes(":") ? ip.split(":").slice(0, 4).join(":") : ip;
  return createHmac("sha256", salt).update(net).digest("hex").slice(0, 16);
}
