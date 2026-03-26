import { createSqliteModel } from './createSqliteModel.js';

const model = createSqliteModel({
  tableName: 'wp_term_taxonomy',
  idColumns: 'term_taxonomy_id',
  columns: ['term_id', 'taxonomy', 'description', 'parent', 'count']
});

export default model;
