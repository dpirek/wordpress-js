import { createSqliteModel } from './createSqliteModel.js';

const model = createSqliteModel({
  tableName: 'wp_options',
  idColumns: 'option_id',
  columns: ['option_name', 'option_value', 'autoload']
});

export default model;
