import { Router } from 'express';
import { saveHostSettings, getHostSettings } from './settings';

const router = Router();

router.post('/', (req, res) => {
  console.log('Saving settings:', req.body); 
  saveHostSettings(req.body);
  res.status(200).json({ message: 'Settings saved in memory!' });
});

router.get('/', (req, res) => {
  try {
    const settings = getHostSettings();
    res.status(200).json(settings || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

export default router;