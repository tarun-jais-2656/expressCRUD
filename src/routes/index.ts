import { Router } from 'express';
import { curlResponse } from '../middlewares/curlResponse.js';
import markController from '../modules/mark/mark.controller.js';
import postController from '../modules/post/post.controller.js';
import studentController from '../modules/student/student.controller.js';
import userController from '../modules/user/user.controller.js';

const router = Router();

router.use('/users', curlResponse, userController);
router.use('/posts', curlResponse, postController);
router.use('/students', curlResponse, studentController);
router.use('/marks', curlResponse, markController);

export default router;
