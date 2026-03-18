import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";
// @ts-ignore
import backendApp from "./src/app.js";
// @ts-ignore
import connectDB from "./src/config/db.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to Database
  if (process.env.MONGO_URI) {
    await connectDB();
  } else {
    console.warn("MONGO_URI not set, skipping database connection");
  }

  app.use(express.json());

  // Mount the real backend
  app.use(backendApp);

  // Shipday Proxy Route
  app.post("/api/shipday/orders", async (req, res) => {
    try {
      const apiKey = process.env.SHIPDAY_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: 'SHIPDAY_API_KEY environment variable is required' });
      }

      // Shipday API expects Basic Auth with the API key as the username and empty password
      // Or just the API key in the Authorization header depending on the docs.
      // The standard is Basic Auth with the API key.
      const authHeader = `Basic ${apiKey}`;

      const response = await axios.post("https://api.shipday.com/orders", req.body, {
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        }
      });

      res.json({ success: true, data: response.data });
    } catch (error: any) {
      console.error("Shipday API Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        success: false, 
        error: error.response?.data || error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
