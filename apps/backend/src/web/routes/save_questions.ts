import { Router } from "express";
import { MongoClient } from "mongodb";

const router = Router();
const mongoURL = "mongodb://localhost:27017";
const client = new MongoClient(mongoURL);

router.post("/save_manual_poll", async (req, res) => {
  const data = req.body;

  try {
    await client.connect();
    const db = client.db("polls");
    const collection = db.collection("manual_poll_questions");

    await collection.insertOne(data);
    res.json({ message: "Questions saved to DB" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  } finally {
    await client.close();
  }
});

export default router;
