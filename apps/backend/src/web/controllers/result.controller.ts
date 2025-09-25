import { Request, Response } from 'express';
import { Result } from '../models/result.model';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const createResult = async (req: Request, res: Response) => {
  try {
    const { user_name, user_id, score, room_code } = req.body;

    if (!user_name || !user_id || score === undefined) {
      throw new ValidationError('user_name, user_id, and score are required');
    }

    const result = new Result({
      user_name,
      user_id,
      score,
      room_code,
    });

    await result.save();

    res.status(201).json({
      success: true,
      message: 'Result saved successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      console.error('Error saving result:', error);
      res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  }
};

export const getResults = async (req: Request, res: Response) => {
  try {
    const { room_code } = req.query;

    const filter = room_code ? { room_code } : {};
    const results = await Result.find(filter).sort({ created_at: -1 });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
