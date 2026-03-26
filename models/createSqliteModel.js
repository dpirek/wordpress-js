import { db } from './wordpressDb.js';

function parseInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

function normalizeIdColumns(idColumns) {
  if (Array.isArray(idColumns) && idColumns.length > 0) {
    return idColumns;
  }
  if (typeof idColumns === 'string' && idColumns.trim()) {
    return [idColumns];
  }

  const error = new Error('idColumns must be a non-empty string or array');
  error.statusCode = 500;
  throw error;
}

function buildWhereClause(idColumnList) {
  return idColumnList.map(column => `${column} = ?`).join(' AND ');
}

function pickInsertColumns(allowedColumns, payload) {
  return allowedColumns.filter(column => payload[column] !== undefined);
}

function prepareUpdateColumns(allowedColumns, payload) {
  return allowedColumns.filter(column => payload[column] !== undefined);
}

function makeNotFoundError(tableName) {
  const error = new Error(`${tableName} record not found`);
  error.statusCode = 404;
  return error;
}

function createSqliteModel({ tableName, idColumns, columns, orderBy }) {
  if (!tableName || !Array.isArray(columns) || columns.length === 0) {
    const error = new Error('tableName and columns are required');
    error.statusCode = 500;
    throw error;
  }

  const idColumnList = normalizeIdColumns(idColumns);
  const whereById = buildWhereClause(idColumnList);
  const selectedColumns = [...idColumnList, ...columns].join(', ');
  const tableOrderBy = orderBy || idColumnList.join(', ');

  const getAllStmt = db.prepare(`
    SELECT ${selectedColumns}
    FROM ${tableName}
    ORDER BY ${tableOrderBy} ASC
  `);

  const getByIdStmt = db.prepare(`
    SELECT ${selectedColumns}
    FROM ${tableName}
    WHERE ${whereById}
  `);

  function mapRow(row) {
    if (!row) {
      return null;
    }

    return row;
  }

  function parseIdArgs(idArgs) {
    if (idArgs.length !== idColumnList.length) {
      const error = new Error(`Expected ${idColumnList.length} id value(s)`);
      error.statusCode = 400;
      throw error;
    }

    return idArgs.map((value, index) => parseInteger(value, idColumnList[index]));
  }

  function getAll() {
    return getAllStmt.all().map(mapRow);
  }

  function getById(...ids) {
    const parsedIds = parseIdArgs(ids);
    return mapRow(getByIdStmt.get(...parsedIds));
  }

  function create(payload = {}) {
    const insertColumns = pickInsertColumns(columns, payload);

    if (insertColumns.length === 0) {
      const insertDefaultStmt = db.prepare(`
        INSERT INTO ${tableName}
        DEFAULT VALUES
      `);
      const result = insertDefaultStmt.run();

      if (idColumnList.length === 1) {
        return getById(result.lastInsertRowid);
      }

      const error = new Error(`Payload required for ${tableName} composite key inserts`);
      error.statusCode = 400;
      throw error;
    }

    const placeholders = insertColumns.map(() => '?').join(', ');
    const values = insertColumns.map(column => payload[column]);

    const insertStmt = db.prepare(`
      INSERT INTO ${tableName} (${insertColumns.join(', ')})
      VALUES (${placeholders})
    `);

    const result = insertStmt.run(...values);

    if (idColumnList.length === 1) {
      const idColumn = idColumnList[0];
      const idValue = payload[idColumn] !== undefined ? payload[idColumn] : result.lastInsertRowid;
      return getById(idValue);
    }

    const idValues = idColumnList.map(column => payload[column]);
    if (idValues.some(value => value === undefined)) {
      const error = new Error(`Composite id values are required in payload for ${tableName}`);
      error.statusCode = 400;
      throw error;
    }

    return getById(...idValues);
  }

  function update(...args) {
    const payload = args[args.length - 1] || {};
    const idArgs = args.slice(0, -1);

    const parsedIds = parseIdArgs(idArgs);
    const existing = getById(...parsedIds);
    if (!existing) {
      throw makeNotFoundError(tableName);
    }

    const updateColumns = prepareUpdateColumns(columns, payload);
    if (updateColumns.length === 0) {
      const error = new Error('No updatable fields provided');
      error.statusCode = 400;
      throw error;
    }

    const assignments = updateColumns.map(column => `${column} = ?`).join(', ');
    const values = updateColumns.map(column => payload[column]);

    const updateStmt = db.prepare(`
      UPDATE ${tableName}
      SET ${assignments}
      WHERE ${whereById}
    `);

    updateStmt.run(...values, ...parsedIds);
    return getById(...parsedIds);
  }

  function deleteById(...ids) {
    const parsedIds = parseIdArgs(ids);
    const existing = getById(...parsedIds);
    if (!existing) {
      throw makeNotFoundError(tableName);
    }

    const deleteStmt = db.prepare(`
      DELETE FROM ${tableName}
      WHERE ${whereById}
    `);

    deleteStmt.run(...parsedIds);
  }

  return {
    getAll,
    getById,
    create,
    update,
    deleteById
  };
}

export { createSqliteModel };
