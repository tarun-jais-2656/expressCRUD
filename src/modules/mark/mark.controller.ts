import { Router } from 'express';
import { idParam } from '../../utils/validators.js';
import { sendSuccess } from '../../utils/response.js';
import { averagesQueryDto, updateMarkDto } from './mark.dto.js';
import * as markService from './mark.service.js';

const router = Router();

router.get('/averages', async (req, res) => {
  const query = averagesQueryDto.parse(req.query);
  sendSuccess(res, await markService.subjectAverages(query));
});

router.patch('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  const body = updateMarkDto.parse(req.body);
  sendSuccess(res, await markService.updateMark(id, body));
});

router.delete('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  await markService.deleteMark(id);
  sendSuccess(res, null, 204);
});

export default router;
