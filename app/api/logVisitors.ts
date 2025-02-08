import { NextApiRequest, NextApiResponse } from "next";
import { logVisitor } from "./../../lib/actions"; // Adjust path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      await logVisitor();
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("❌ Error in API:", error);
      return res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
  return res.status(405).json({ message: "Method Not Allowed" });
}
