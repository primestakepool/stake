// backend/server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const BLOCKFROST_KEY = process.env.BLOCKFROST_KEY; // Set in environment variables

app.get("/epoch-params", async (req, res) => {
  try {
    const response = await fetch(
      "https://cardano-mainnet.blockfrost.io/api/v0/epochs/latest/parameters",
      {
        headers: { "project_id": BLOCKFROST_KEY }
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
