import { getEnv } from '../../config/env.js';
import { badRequest, notFound } from '../../errors/AppError.js';
import type { CreateMarksDto, MarkResponseDto, SubjectAverageResponseDto, UpdateMarkDto } from './mark.dto.js';
import type { Mark, SubjectAverage } from './mark.interface.js';
import * as markRepository from './mark.repository.js';

export const round2 = (value: number): number => Math.round(value * 100) / 100;

export const toResponseDto = (mark: Mark): MarkResponseDto => ({
  id: mark.id,
  studentId: mark.studentId,
  exam: mark.exam,
  subject: mark.subject,
  score: mark.score,
  maxScore: mark.maxScore,
  createdAt: mark.createdAt.toISOString(),
  updatedAt: mark.updatedAt.toISOString(),
});

export const decorateAverage = (row: SubjectAverage, passPercentage: number): SubjectAverageResponseDto => {
  const averagePercentage = round2(row.averagePercentage);
  return {
    subject: row.subject,
    averagePercentage,
    students: row.students,
    passed: averagePercentage >= passPercentage,
  };
};

export const createMarks = async (studentId: number, input: CreateMarksDto): Promise<MarkResponseDto[]> => {
  const created = await markRepository.insertMany(
    studentId,
    input.exam,
    input.marks.map((mark) => ({
      subject: mark.subject,
      score: mark.score,
      maxScore: mark.maxScore,
    })),
  );
  return created.map(toResponseDto);
};

export const updateMark = async (id: number, input: UpdateMarkDto): Promise<MarkResponseDto> => {
  const existing = await markRepository.findById(id);
  if (!existing) throw notFound(`Mark ${id} not found`);

  const score = input.score ?? existing.score;
  const maxScore = input.maxScore ?? existing.maxScore;
  if (score > maxScore) {
    throw badRequest('score must be less than or equal to maxScore', [
      { path: 'score', message: 'score must be less than or equal to maxScore' },
    ]);
  }

  const updated = await markRepository.update(id, { score, maxScore });
  if (!updated) throw notFound(`Mark ${id} not found`);
  return toResponseDto(updated);
};

export const deleteMark = async (id: number): Promise<void> => {
  const deleted = await markRepository.remove(id);
  if (!deleted) throw notFound(`Mark ${id} not found`);
};

export const subjectAverages = async (filter: {
  className: string;
  exam?: CreateMarksDto['exam'];
  section?: string;
}): Promise<SubjectAverageResponseDto[]> => {
  const rows = await markRepository.subjectAverages(filter);
  const passPercentage = getEnv().PASS_PERCENTAGE;
  return rows.map((row) => decorateAverage(row, passPercentage));
};
