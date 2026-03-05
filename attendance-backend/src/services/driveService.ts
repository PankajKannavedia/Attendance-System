import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export const uploadToDrive = async (base64String: string, fileName: string) => {
  try {
    // 1. Ensure the assets/images directory exists
    const dirPath = path.join(process.cwd(), "assets", "images");
    await fs.mkdir(dirPath, { recursive: true });

    // 2. Extract base64 without the Data URI prefix if present
    const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
    
    if (!base64Data) {
      throw new Error("Invalid base64 string provided for image upload.");
    }

    // 3. Write file
    const buffer = Buffer.from(base64Data, "base64");
    const filePath = path.join(dirPath, fileName);
    await fs.writeFile(filePath, buffer);

    // 4. Return the local URL path so the frontend can retrieve it later
    const HOST = process.env.HOST || `http://localhost:${process.env.PORT || 5001}`;
    return `${HOST}/assets/images/${fileName}`;
  } catch (error) {
    console.error("Local Upload Error:", error);
    return "N/A";
  }
};