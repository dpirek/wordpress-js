import { createSqliteModel } from './createSqliteModel.js';

const model = createSqliteModel({
  tableName: 'wp_usermeta',
  idColumns: 'umeta_id',
  columns: ['user_id', 'meta_key', 'meta_value']
});

export default model;
