import { query } from '../../config/db.js';
import { buildInsert, buildUpdate } from '../../db/sql.js';
import { conflict } from '../../errors/AppError.js';
import { pgCode } from '../../db/pgError.js';
import type { User, UserChanges, UserRow } from './user.interface.js';

const COLUMNS = ['name', 'email'] as const;

export const toDomain = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const toPersistence = (changes: UserChanges): Record<string, string> => {
  const columns: Record<string, string> = {};
  if (changes.name !== undefined) columns.name = changes.name;
  if (changes.email !== undefined) columns.email = changes.email;
  return columns;
};

const translate = (err: unknown): Error => {
  if (pgCode(err) === '23505') return conflict('A user with that email already exists');
  return err instanceof Error ? err : new Error('Database error');
};

export const findById = async (id: number): Promise<User | null> => {
  const result = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  const row = result.rows[0];
  return row ? toDomain(row) : null;
};

export const insert = async (changes: UserChanges): Promise<User> => {
  const statement = buildInsert('users', COLUMNS, toPersistence(changes));
  try {
    const result = await query<UserRow>(statement.text, statement.values);
    const row = result.rows[0];
    if (!row) throw new Error('Insert did not return a user');
    return toDomain(row);
  } catch (err) {
    throw translate(err);
  }
};

export const update = async (id: number, changes: UserChanges): Promise<User | null> => {
  const statement = buildUpdate('users', COLUMNS, id, toPersistence(changes));
  try {
    const result = await query<UserRow>(statement.text, statement.values);
    const row = result.rows[0];
    return row ? toDomain(row) : null;
  } catch (err) {
    throw translate(err);
  }
};
