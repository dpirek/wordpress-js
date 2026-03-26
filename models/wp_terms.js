import { createSqliteModel } from './createSqliteModel.js';

const model = createSqliteModel({
  tableName: 'wp_terms',
  idColumns: 'term_id',
  columns: ['name', 'slug', 'term_group']
});

export default model;
