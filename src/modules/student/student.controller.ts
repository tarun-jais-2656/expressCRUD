import { Router } from 'express';
import { createMarksDto } from '../mark/mark.dto.js';
import * as markService from '../mark/mark.service.js';
import { idParam } from '../../utils/validators.js';
import { sendSuccess } from '../../utils/response.js';
import { createStudentDto, listStudentsQueryDto, updateStudentDto } from './student.dto.js';
import * as studentService from './student.service.js';

const router = Router();

router.get('/', async (req, res) => {
  const query = listStudentsQueryDto.parse(req.query);
  sendSuccess(res, await studentService.listStudents(query));
});

router.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  sendSuccess(res, await studentService.getStudent(id));
});

router.post('/', async (req, res) => {
  const body = createStudentDto.parse(req.body);
  sendSuccess(res, await studentService.createStudent(body), 201);
});

router.post('/:id/marks', async (req, res) => {
  const { id } = idParam.parse(req.params);
  const body = createMarksDto.parse(req.body);
  sendSuccess(res, await markService.createMarks(id, body), 201);
});

router.patch('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  const body = updateStudentDto.parse(req.body);
  sendSuccess(res, await studentService.updateStudent(id, body));
});

router.delete('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  await studentService.deleteStudent(id);
  sendSuccess(res, null, 204);
});

export default router;
