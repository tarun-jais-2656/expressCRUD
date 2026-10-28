import type { Response } from 'express';

/** The only way handlers send a successful body. */
export const sendSuccess = (res: Response, data: unknown, status = 200): void => {
  if (status === 204) {
    res.status(204).end();
    return;
  }
  res.status(status).json({ data });
};
