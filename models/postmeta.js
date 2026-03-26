import { createSqliteModel } from './createSqliteModel.js';

const model = createSqliteModel({
  tableName: 'wp_postmeta',
  idColumns: 'meta_id',
  columns: ['post_id', 'meta_key', 'meta_value']
});

export default model;
