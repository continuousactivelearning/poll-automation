import { Request, Response, NextFunction } from 'express';
import PollGeneration from '../models/PollRoomCode';

// POST /polls - Create a new poll
export const createPoll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { room_title, room_code, user_id } = req.body;

    if (!room_title || !room_code || !user_id) {
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    const newPoll = await PollGeneration.create({
      room_title,
      room_code,
      user_id,
    });
    res.status(201).json(newPoll);
  } catch (err) {
    next(err);
  }
};

// GET /polls - Get all polls
export const getAllPolls = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const polls = await PollGeneration.find();
    res.status(200).json(polls);
  } catch (err) {
    next(err);
  }
};

// GET /polls/:id - Get single poll by ID
export const getPollById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log(req.params.id);

  try {
    const poll = await PollGeneration.find({
      room_code: req.params.id,
    });
    if (!poll) {
      res.status(404).json({ message: 'Poll not found.' });
      return;
    }

    res.status(200).json(poll);
  } catch (err) {
    next(err);
  }
};

// PUT /polls/:id - Update poll by ID
export const updatePoll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { room_title, room_code, user_id } = req.body;

    const updatedPoll = await PollGeneration.findByIdAndUpdate(
      req.params.id,
      { room_title, room_code, user_id },
      { new: true, runValidators: true }
    );

    if (!updatedPoll) {
      res.status(404).json({ message: 'Poll not found.' });
      return;
    }

    res.status(200).json(updatedPoll);
  } catch (err) {
    next(err);
  }
};

// DELETE /polls/:roomCode - Delete poll by room code
export const deletePollByRoomCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { roomCode } = req.params;

    if (!roomCode) {
      res.status(400).json({ message: 'Room code is required.' });
      return;
    }

    const deletedPoll = await PollGeneration.findOneAndDelete({
      room_code: roomCode,
    });

    if (!deletedPoll) {
      res.status(404).json({ message: 'Poll not found.' });
      return;
    }

    res.status(200).json({
      message: 'Poll deleted successfully',
      deletedPoll,
    });
  } catch (err) {
    next(err);
  }
};
