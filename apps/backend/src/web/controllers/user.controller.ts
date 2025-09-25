import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { extractIdFromToken } from '../utils/jwt';
import path from 'path';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    const jwtUser = extractIdFromToken(
      req.headers.authorization?.split(' ')[1] || ''
    );
    if (!jwtUser) throw new ValidationError('Unauthorized');

    const user = await User.findById(jwtUser.id);
    if (!user) throw new ValidationError('User not found');

    res.json(user);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const jwtUser = extractIdFromToken(
      req.headers.authorization?.split(' ')[1] || ''
    );
    if (!jwtUser) throw new ValidationError('Unauthorized');

    const { firstName, lastName, email, bio, avatar, fullName } = req.body;

    // Build update object
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Handle name fields - prioritize fullName, fallback to firstName + lastName
    if (fullName !== undefined) {
      updateData.fullName = fullName;
      // Split fullName into firstName and lastName for consistency
      const nameParts = fullName.trim().split(' ');
      updateData.firstName = nameParts[0] || '';
      updateData.lastName = nameParts.slice(1).join(' ') || '';
    } else if (firstName !== undefined || lastName !== undefined) {
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      // Build fullName from firstName and lastName
      updateData.fullName = `${firstName || ''} ${lastName || ''}`.trim();
    }

    const user = await User.findByIdAndUpdate(jwtUser.id, updateData, {
      new: true,
    });

    if (!user) throw new ValidationError('User not found');

    res.json(user);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const jwtUser = extractIdFromToken(
      req.headers.authorization?.split(' ')[1] || ''
    );
    if (!jwtUser) throw new ValidationError('Unauthorized');

    if (!req.file) throw new ValidationError('No file uploaded');

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      jwtUser.id,
      { avatar: avatarPath },
      { new: true }
    );

    if (!user) throw new ValidationError('User not found');

    res.status(200).json({ avatar: avatarPath });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
    } else {
      console.error('Avatar upload failed', error);
      res.status(500).json({ message: 'Failed to upload avatar' });
    }
  }
};
