import { Router } from 'express';
import Question from '../models/question.model';
import { mongoPollingWatcher } from '../../services/mongoPollingWatcher';

const router = Router();

// Get all questions
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get watcher statistics
router.get('/watcher-stats', async (req, res) => {
  try {
    const stats = mongoPollingWatcher.getStats();
    const totalQuestions = await Question.countDocuments();
    const activeQuestions = await Question.countDocuments({
      is_active: true,
      is_approved: true,
    });

    res.json({
      watcher: stats,
      database: {
        totalQuestions,
        activeQuestions,
        lastChecked: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Trigger manual check
router.post('/trigger-check', async (req, res) => {
  try {
    await mongoPollingWatcher.triggerCheck();
    res.json({ message: 'Manual check triggered successfully' });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create a new question
router.post('/', async (req, res) => {
  try {
    const questionData = req.body;
    const newQuestion = new Question(questionData);
    const savedQuestion = await newQuestion.save();

    console.log('📝 New question created:', savedQuestion._id);
    res.status(201).json(savedQuestion);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// // Update a question - commented out due to TypeScript issues
// router.put('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const updatedQuestion = await Question.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true }
//     );

//     if (!updatedQuestion) {
//       return res.status(404).json({ error: 'Question not found' });
//     }

//     console.log('✏️ Question updated:', updatedQuestion._id);
//     res.json(updatedQuestion);
//   } catch (error) {
//     res.status(500).json({
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// });

// // Delete a question - commented out due to TypeScript issues
// router.delete('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deletedQuestion = await Question.findByIdAndDelete(id);

//     if (!deletedQuestion) {
//       return res.status(404).json({ error: 'Question not found' });
//     }

//     console.log('🗑️ Question deleted:', deletedQuestion._id);
//     res.json({ message: 'Question deleted successfully' });
//   } catch (error) {
//     res.status(500).json({
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// });

export default router;
