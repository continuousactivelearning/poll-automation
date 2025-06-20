import { Router } from "express";
import fs from "fs";

const settingsRouter = Router();

let inMemorySettings: any = {}; 

settingsRouter.post("/settings", (req, res) => {
  inMemorySettings = req.body;
  console.log("Settings received and stored:", inMemorySettings);
  res.json({ message: "Settings updated" });
});

settingsRouter.get("/settings", (req, res) => {
  res.json(inMemorySettings);
});

export default settingsRouter;
