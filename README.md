# School records API

Students, guardians, and exam marks. Configuration, validation, and row mapping follow the rules below. New modules copy `src/modules/user` and `src/modules/post`.

## 1. Configuration

`src/config/env.ts` is the only place environment variables are read.

- `validateConfig(source)` parses one Zod schema. It throws an `Error` whose message names the variable and says what is wrong. `src/server.ts` prints that message and exits with code 1. There is no second validator.
- `PASS_PERCENTAGE` and `ACADEMIC_YEAR` are required and have no default. `PASS_PERCENTAGE` is a number from 0 to 100 (`"33.5"` becomes `33.5`). `ACADEMIC_YEAR` is `YYYY-YY` and the second year must be the first year plus one (`2026-27` is valid, `2026-28` and `26-27` are not).
- `getEnv()` caches a successful parse for the running process. Tests set the same variables in `vitest.config.ts`, so they do not need a `.env`.

```bash
cp .env.example .env
npm run db:migrate
npm run dev
```

## 2. Validation

Request schemas live in each module's `*.dto.ts` and reuse `src/utils/validators.ts`.

- `safeText` trims, NFC-normalises, and rejects control characters, null bytes, and `<` `>`. `personName` and `tag` build on it.
- Body objects use `z.strictObject`, including `guardian` and each `marks[]` item. Unknown keys are a 400. Query objects strip unknown keys.
- `idParam` and `pagination` validate ids, `limit` (1–100), and `offset`.
- `escapeLike` escapes `\`, `%`, and `_` before an `ILIKE` pattern is bound as a parameter.
- `rejectDangerousPayload` / JSON `verify` rejects `__proto__`, `constructor`, and `prototype` before a controller runs.
- Controllers call `schema.parse`. A `ZodError` reaches `errorHandler`, which returns `400` and `details` with dotted paths such as `guardian.phone` and `marks.2.score`. Handlers do not send errors themselves.
- Every success response goes through `sendSuccess`.

## 3. Mapping

Repositories are the only files that see database rows.

- `toDomain(row)` builds the camelCase domain object. Student guardian columns become `guardian`. Mark `NUMERIC` strings such as `"78.50"` become numbers. An unknown `guardian_relation` or exam throws.
- `toPersistence(changes)` flattens a domain change into snake_case columns and omits fields that were not supplied.
- Services call `toResponseDto`. Dates become ISO strings. `dateOfBirth` becomes `YYYY-MM-DD`. Subject averages are rounded to two decimals and `passed` is `averagePercentage >= PASS_PERCENTAGE`.
- SQL values are always `$1`, `$2`, … parameters.

## API

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/students` | Create a student and nested guardian. `201` |
| PATCH | `/api/students/:id` | Partial update. `guardian`, when sent, replaces the whole object |
| GET | `/api/students` | Filters: `className`, `section`, `search`, `limit`, `offset` |
| GET | `/api/students/:id` | |
| DELETE | `/api/students/:id` | `204`. Marks are removed by `ON DELETE CASCADE` |
| POST | `/api/students/:id/marks` | `{ exam, marks: [...] }` saved in one transaction. `201` or `409` |
| PATCH | `/api/marks/:id` | `score` and/or `maxScore`. The merged pair must keep `score <= maxScore` |
| DELETE | `/api/marks/:id` | `204` |
| GET | `/api/marks/averages` | Required `className`. Optional `exam`, `section` |

Create student:

```bash
curl -s -X POST http://localhost:3000/api/students \
  -H 'content-type: application/json' \
  -d '{
    "rollNo": "2026-10A-017",
    "firstName": "Asha",
    "lastName": "Sharma",
    "dateOfBirth": "2014-01-15",
    "className": 10,
    "section": "a",
    "guardian": { "name": "Ravi Sharma", "phone": "+91 98765-43210", "relation": "Father" }
  }'
```

`rollNo` is stored as `2026-10A-017`, `section` as `A`, `relation` as `father`, and the phone as `+919876543210`.

Create marks:

```bash
curl -s -X POST http://localhost:3000/api/students/1/marks \
  -H 'content-type: application/json' \
  -d '{ "exam": "final", "marks": [{ "subject": "maths", "score": 88, "maxScore": 100 }] }'
```

Averages:

```bash
curl -s 'http://localhost:3000/api/marks/averages?className=10&exam=final'
```

```json
{
  "data": [
    { "subject": "maths", "averagePercentage": 72.35, "students": 31, "passed": true }
  ]
}
```

`averagePercentage` is `AVG(score / max_score * 100)` for that subject, rounded to two decimals. `passed` compares it with `PASS_PERCENTAGE`. Subjects with no rows are omitted.

Errors:

```json
{ "error": { "message": "Validation failed", "details": [{ "path": "guardian.phone", "message": "phone must be E.164" }] } }
```

Duplicate roll numbers and duplicate `(student, exam, subject)` marks return `409`. A missing student or mark returns `404`.
