import express from 'express';
import transcriptionRoutes from './transcription/routes';
import webRoutes from './web/routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/transcription', transcriptionRoutes);
app.use('/api', webRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app };