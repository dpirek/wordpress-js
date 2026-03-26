import { createSqliteModel } from './createSqliteModel.js';

const model = createSqliteModel({
  tableName: 'wp_termmeta',
  idColumns: 'meta_id',
  columns: ['term_id', 'meta_key', 'meta_value']
});

export default model;
