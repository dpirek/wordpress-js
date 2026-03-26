import { createSqliteModel } from './createSqliteModel.js';

const model = createSqliteModel({
  tableName: 'wp_users',
  idColumns: 'ID',
  columns: [
    'user_login',
    'user_pass',
    'user_nicename',
    'user_email',
    'user_url',
    'user_registered',
    'user_activation_key',
    'user_status',
    'display_name'
  ]
});

export default model;
