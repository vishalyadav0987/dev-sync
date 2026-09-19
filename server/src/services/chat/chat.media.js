import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, "../../../public/uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const MediaStorageService = {
  /**
   * Saves a base64 image or buffer to local storage and returns a public URL
   */
  async uploadImage(base64Data) {
    // Note: In production, this would upload to S3/Cloudinary
    
    // Extract base64 payload
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 image string");
    }

    const mimeType = matches[1];
    const imageBuffer = Buffer.from(matches[2], "base64");
    
    // Validate size (e.g. 5MB)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      throw new Error("Image too large");
    }

    // Determine extension
    let ext = "png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
    else if (mimeType.includes("gif")) ext = "gif";
    else if (mimeType.includes("webp")) ext = "webp";

    const fileName = `chat_${crypto.randomUUID()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    // Save to disk
    fs.writeFileSync(filePath, imageBuffer);

    // Return public URL (assuming express serves /public)
    // We will need to make sure express serves this directory
    return `/uploads/${fileName}`;
  }
};

export const GifService = {
  /**
   * Search for GIFs using Giphy API, falls back to trending if no query
   */
  async searchGifs(query) {
    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      console.warn("GIPHY_API_KEY not set in .env. Returning mock GIFs.");
      return [
        { id: "1", url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif" },
        { id: "2", url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" },
        { id: "3", url: "https://media.giphy.com/media/l41lOlmIQyA2XkC1a/giphy.gif" }
      ];
    }
    
    try {
      const endpoint = query 
        ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20`;
        
      const res = await fetch(endpoint);
      const json = await res.json();
      
      if (json.data) {
        return json.data.map(gif => ({
          id: gif.id,
          url: gif.images.fixed_height.url,
          title: gif.title
        }));
      }
      return [];
    } catch (err) {
      console.error("Giphy API error:", err);
      return [];
    }
  }
};
