import { createSqliteModel } from './createSqliteModel.js';

const model = createSqliteModel({
  tableName: 'wp_commentmeta',
  idColumns: 'meta_id',
  columns: ['comment_id', 'meta_key', 'meta_value']
});

export default model;
