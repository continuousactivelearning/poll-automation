// Test script to add sample questions for testing
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Question from '../src/models/question.model';

const sampleQuestions = [
  {
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correct_answer: 'Paris',
    explanation: 'Paris is the capital and largest city of France.',
    difficulty: 'easy',
    concept: 'Geography',
    is_active: true,
    is_approved: true,
  },
  {
    question:
      "Which programming language is known as the 'language of the web'?",
    options: ['Python', 'JavaScript', 'Java', 'C++'],
    correct_answer: 'JavaScript',
    explanation:
      'JavaScript is widely used for web development and is considered the language of the web.',
    difficulty: 'medium',
    concept: 'Programming',
    is_active: true,
    is_approved: true,
  },
  {
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correct_answer: '4',
    explanation: '2 + 2 equals 4.',
    difficulty: 'easy',
    concept: 'Mathematics',
    is_active: true,
    is_approved: true,
  },
  {
    question: 'What is the largest planet in our solar system?',
    options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
    correct_answer: 'Jupiter',
    explanation: 'Jupiter is the largest planet in our solar system.',
    difficulty: 'medium',
    concept: 'Science',
    is_active: true,
    is_approved: true,
  },
  {
    question: 'Which HTML tag is used to create a hyperlink?',
    options: ['<link>', '<a>', '<href>', '<url>'],
    correct_answer: '<a>',
    explanation: 'The <a> tag is used to create hyperlinks in HTML.',
    difficulty: 'easy',
    concept: 'Web Development',
    is_active: true,
    is_approved: true,
  },
];

async function addSampleQuestions() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/pollgen'
    );
    console.log('Connected to MongoDB');

    // Clear existing questions
    await Question.deleteMany({});
    console.log('Cleared existing questions');

    // Add sample questions
    await Question.insertMany(sampleQuestions);
    console.log('Added sample questions');

    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

addSampleQuestions();
