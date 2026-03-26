import { createSqliteModel } from './createSqliteModel.js';

const model = createSqliteModel({
  tableName: 'wp_term_relationships',
  idColumns: ['object_id', 'term_taxonomy_id'],
  columns: ['term_order'],
  orderBy: 'object_id, term_taxonomy_id'
});

export default model;
