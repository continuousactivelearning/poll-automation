// backend/web/routes/transcripts.ts
import { Router } from 'express';

let transcriptsRouter=Router();

let inMemoryTranscripts: any = {}; 

transcriptsRouter.post("/realtime", async (req, res) => {
    inMemoryTranscripts = req.body;
    console.log("Settings received and stored:", inMemoryTranscripts);
    res.json({ message: "Transcripts updated" });
})

transcriptsRouter.get("/realtime", (req, res) => {
  res.json(inMemoryTranscripts);
});

export default transcriptsRouter;
