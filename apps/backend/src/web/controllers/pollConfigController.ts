// // File: apps/backend/src/web/controllers/pollConfigController.ts

// import { Request, Response } from 'express';
// import PollConfigModel from '../models/PollConfig';

// // Get poll config (host settings + questions)
// export const getPollConfig = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const config = await PollConfigModel.find().lean();
//     if (!config) {
//       res.status(404).json({ message: 'Poll config not found' });
//       return;
//     }
//     res.json(config);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching poll config', error });
//   }
// };

// // Update host settings (without touching questions)
// export const updateHostSettings = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   const {
//     id,
//     questionFrequencyMinutes,
//     questionsPerPoll,
//     visibilityMinutes,
//     difficulty,
//   } = req.body;
//   try {
//     let config = await PollConfigModel.findOne({ _id: id });
//     if (!config) {
//       config = new PollConfigModel({
//         questionFrequencyMinutes,
//         questionsPerPoll,
//         visibilityMinutes,
//         difficulty,
//         questions: [],
//       });
//     } else {
//       config.questionFrequencyMinutes = questionFrequencyMinutes;
//       config.questionsPerPoll = questionsPerPoll;
//       config.visibilityMinutes = visibilityMinutes;
//       config.difficulty = difficulty;
//     }
//     await config.save();
//     res.json(config);
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating host settings', error });
//   }
// };

// // Add a poll question
// export const addPollQuestion = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   const question = req.body;
//   try {
//     // let config = await PollConfigModel.findOne();
//     // if (!config) {
//     //   config = new PollConfigModel({
//     //     questionFrequencyMinutes: 5,
//     //     questionsPerPoll: 3,
//     //     visibilityMinutes: 5,
//     //     difficulty: 'Medium',
//     //     questions: [question],
//     //   });
//     // } else {
//     //   config.questions.push(question);
//     // }
//     const data = new PollConfigModel(question);
//     const result = await data.save();
//     res.status(201).json(result);
//   } catch (error) {
//     res.status(500).json({ message: 'Error adding poll question', error });
//   }
// };
