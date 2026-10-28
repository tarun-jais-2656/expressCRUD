import { notFound } from '../../errors/AppError.js';
import { calendarDate, formatDateOnly } from '../../utils/dates.js';
import type { CreateStudentDto, ListStudentsQueryDto, StudentResponseDto, UpdateStudentDto } from './student.dto.js';
import type { Student, StudentChanges } from './student.interface.js';
import * as studentRepository from './student.repository.js';

export const toResponseDto = (student: Student): StudentResponseDto => ({
  id: student.id,
  rollNo: student.rollNo,
  firstName: student.firstName,
  lastName: student.lastName,
  dateOfBirth: formatDateOnly(student.dateOfBirth),
  className: student.className,
  section: student.section,
  guardian: student.guardian,
  createdAt: student.createdAt.toISOString(),
  updatedAt: student.updatedAt.toISOString(),
});

const toChanges = (input: CreateStudentDto | UpdateStudentDto): StudentChanges => ({
  ...(input.rollNo !== undefined ? { rollNo: input.rollNo } : {}),
  ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
  ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
  ...(input.dateOfBirth !== undefined ? { dateOfBirth: calendarDate(input.dateOfBirth) } : {}),
  ...(input.className !== undefined ? { className: input.className } : {}),
  ...(input.section !== undefined ? { section: input.section } : {}),
  ...(input.guardian !== undefined ? { guardian: input.guardian } : {}),
});

export const createStudent = async (input: CreateStudentDto): Promise<StudentResponseDto> =>
  toResponseDto(await studentRepository.insert(toChanges(input)));

export const updateStudent = async (id: number, input: UpdateStudentDto): Promise<StudentResponseDto> => {
  const existing = await studentRepository.findById(id);
  if (!existing) throw notFound(`Student ${id} not found`);
  const updated = await studentRepository.update(id, toChanges(input));
  if (!updated) throw notFound(`Student ${id} not found`);
  return toResponseDto(updated);
};

export const getStudent = async (id: number): Promise<StudentResponseDto> => {
  const student = await studentRepository.findById(id);
  if (!student) throw notFound(`Student ${id} not found`);
  return toResponseDto(student);
};

export const listStudents = async (query: ListStudentsQueryDto): Promise<StudentResponseDto[]> => {
  const students = await studentRepository.findMany(query);
  return students.map(toResponseDto);
};

export const deleteStudent = async (id: number): Promise<void> => {
  const deleted = await studentRepository.remove(id);
  if (!deleted) throw notFound(`Student ${id} not found`);
};
