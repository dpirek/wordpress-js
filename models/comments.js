import { createSqliteModel } from './createSqliteModel.js';

const model = createSqliteModel({
  tableName: 'wp_comments',
  idColumns: 'comment_ID',
  columns: [
    'comment_post_ID',
    'comment_author',
    'comment_author_email',
    'comment_author_url',
    'comment_author_IP',
    'comment_date',
    'comment_date_gmt',
    'comment_content',
    'comment_karma',
    'comment_approved',
    'comment_agent',
    'comment_type',
    'comment_parent',
    'user_id'
  ]
});

export default model;
