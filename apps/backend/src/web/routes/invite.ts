import { Router, Request, Response } from "express";
import nodemailer from "nodemailer";

const router = Router();

router.post("/invite-students", async (req: Request, res: Response): Promise<any> => {
  const { roomCode, roomName, students } = req.body;
  if (!roomCode || !students || !Array.isArray(students)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  // Setup nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    for (const student of students) {
      await transporter.sendMail({
        from: `Poll Generation Team <${process.env.SENDER_EMAIL}>`,
        to: student.email,
        subject: `You're invited to join a poll: ${roomName || roomCode}`,
        html: `<p>Hello${student.name ? ` ${student.name}` : ""},</p>
               <p>You have been invited to participate in a poll session.</p>
               <p><b>Room Name:</b> ${roomName || "Untitled"}<br>
               <b>Room Code:</b> ${roomCode}</p>
               <p>Please use the above room code to join the poll session in the PollGen platform.</p>
               <p>Best regards,<br/>Poll Generation Team</p>`,
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send invites:", err);
    res.status(500).json({ message: "Failed to send invites" });
  }
});

export default router;