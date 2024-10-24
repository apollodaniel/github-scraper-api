import { Router } from 'express';
import profile from './profile';
import repos from './repositories';

const router = Router();

router.use(repos);
router.use(profile);

export default router;
