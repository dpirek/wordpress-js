PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS wp_users (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  user_login TEXT NOT NULL UNIQUE,
  user_pass TEXT NOT NULL,
  user_nicename TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_url TEXT NOT NULL DEFAULT '',
  user_registered TEXT NOT NULL DEFAULT '0000-00-00 00:00:00',
  user_activation_key TEXT NOT NULL DEFAULT '',
  user_status INTEGER NOT NULL DEFAULT 0,
  display_name TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS wp_posts (
  ID INTEGER PRIMARY KEY AUTOINCREMENT,
  post_author INTEGER NOT NULL DEFAULT 0,
  post_date TEXT NOT NULL DEFAULT '0000-00-00 00:00:00',
  post_date_gmt TEXT NOT NULL DEFAULT '0000-00-00 00:00:00',
  post_content TEXT NOT NULL,
  post_title TEXT NOT NULL,
  post_excerpt TEXT NOT NULL,
  post_status TEXT NOT NULL DEFAULT 'publish',
  comment_status TEXT NOT NULL DEFAULT 'open',
  ping_status TEXT NOT NULL DEFAULT 'open',
  post_password TEXT NOT NULL DEFAULT '',
  post_name TEXT NOT NULL DEFAULT '',
  to_ping TEXT NOT NULL,
  pinged TEXT NOT NULL,
  post_modified TEXT NOT NULL DEFAULT '0000-00-00 00:00:00',
  post_modified_gmt TEXT NOT NULL DEFAULT '0000-00-00 00:00:00',
  post_content_filtered TEXT NOT NULL,
  post_parent INTEGER NOT NULL DEFAULT 0,
  guid TEXT NOT NULL DEFAULT '',
  menu_order INTEGER NOT NULL DEFAULT 0,
  post_type TEXT NOT NULL DEFAULT 'post',
  post_mime_type TEXT NOT NULL DEFAULT '',
  comment_count INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (post_author) REFERENCES wp_users(ID) ON DELETE SET DEFAULT,
  FOREIGN KEY (post_parent) REFERENCES wp_posts(ID) ON DELETE SET DEFAULT
);

CREATE TABLE IF NOT EXISTS wp_postmeta (
  meta_id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  meta_key TEXT,
  meta_value TEXT,
  FOREIGN KEY (post_id) REFERENCES wp_posts(ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wp_comments (
  comment_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_post_ID INTEGER NOT NULL DEFAULT 0,
  comment_author TEXT NOT NULL,
  comment_author_email TEXT NOT NULL DEFAULT '',
  comment_author_url TEXT NOT NULL DEFAULT '',
  comment_author_IP TEXT NOT NULL DEFAULT '',
  comment_date TEXT NOT NULL DEFAULT '0000-00-00 00:00:00',
  comment_date_gmt TEXT NOT NULL DEFAULT '0000-00-00 00:00:00',
  comment_content TEXT NOT NULL,
  comment_karma INTEGER NOT NULL DEFAULT 0,
  comment_approved TEXT NOT NULL DEFAULT '1',
  comment_agent TEXT NOT NULL DEFAULT '',
  comment_type TEXT NOT NULL DEFAULT 'comment',
  comment_parent INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (comment_post_ID) REFERENCES wp_posts(ID) ON DELETE CASCADE,
  FOREIGN KEY (comment_parent) REFERENCES wp_comments(comment_ID) ON DELETE SET DEFAULT,
  FOREIGN KEY (user_id) REFERENCES wp_users(ID) ON DELETE SET DEFAULT
);

CREATE TABLE IF NOT EXISTS wp_commentmeta (
  meta_id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  meta_key TEXT,
  meta_value TEXT,
  FOREIGN KEY (comment_id) REFERENCES wp_comments(comment_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wp_terms (
  term_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  term_group INTEGER NOT NULL DEFAULT 0,
  UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS wp_termmeta (
  meta_id INTEGER PRIMARY KEY AUTOINCREMENT,
  term_id INTEGER NOT NULL,
  meta_key TEXT,
  meta_value TEXT,
  FOREIGN KEY (term_id) REFERENCES wp_terms(term_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wp_term_taxonomy (
  term_taxonomy_id INTEGER PRIMARY KEY AUTOINCREMENT,
  term_id INTEGER NOT NULL,
  taxonomy TEXT NOT NULL,
  description TEXT NOT NULL,
  parent INTEGER NOT NULL DEFAULT 0,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (term_id, taxonomy),
  FOREIGN KEY (term_id) REFERENCES wp_terms(term_id) ON DELETE CASCADE,
  FOREIGN KEY (parent) REFERENCES wp_terms(term_id) ON DELETE SET DEFAULT
);

CREATE TABLE IF NOT EXISTS wp_term_relationships (
  object_id INTEGER NOT NULL,
  term_taxonomy_id INTEGER NOT NULL,
  term_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (object_id, term_taxonomy_id),
  FOREIGN KEY (object_id) REFERENCES wp_posts(ID) ON DELETE CASCADE,
  FOREIGN KEY (term_taxonomy_id) REFERENCES wp_term_taxonomy(term_taxonomy_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wp_usermeta (
  umeta_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  meta_key TEXT,
  meta_value TEXT,
  FOREIGN KEY (user_id) REFERENCES wp_users(ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wp_options (
  option_id INTEGER PRIMARY KEY AUTOINCREMENT,
  option_name TEXT NOT NULL UNIQUE,
  option_value TEXT NOT NULL,
  autoload TEXT NOT NULL DEFAULT 'yes'
);

CREATE TABLE IF NOT EXISTS wp_links (
  link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_url TEXT NOT NULL,
  link_name TEXT NOT NULL,
  link_image TEXT NOT NULL,
  link_target TEXT NOT NULL,
  link_description TEXT NOT NULL,
  link_visible TEXT NOT NULL DEFAULT 'Y',
  link_owner INTEGER NOT NULL DEFAULT 1,
  link_rating INTEGER NOT NULL DEFAULT 0,
  link_updated TEXT NOT NULL DEFAULT '0000-00-00 00:00:00',
  link_rel TEXT NOT NULL,
  link_notes TEXT NOT NULL,
  link_rss TEXT NOT NULL,
  FOREIGN KEY (link_owner) REFERENCES wp_users(ID) ON DELETE SET DEFAULT
);

-- Useful secondary indexes
CREATE INDEX IF NOT EXISTS idx_wp_posts_post_author ON wp_posts(post_author);
CREATE INDEX IF NOT EXISTS idx_wp_posts_post_name ON wp_posts(post_name);
CREATE INDEX IF NOT EXISTS idx_wp_posts_post_type_status_date ON wp_posts(post_type, post_status, post_date);

CREATE INDEX IF NOT EXISTS idx_wp_postmeta_post_id ON wp_postmeta(post_id);
CREATE INDEX IF NOT EXISTS idx_wp_postmeta_meta_key ON wp_postmeta(meta_key);

CREATE INDEX IF NOT EXISTS idx_wp_comments_post_id ON wp_comments(comment_post_ID);
CREATE INDEX IF NOT EXISTS idx_wp_comments_user_id ON wp_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_wp_comments_parent ON wp_comments(comment_parent);

CREATE INDEX IF NOT EXISTS idx_wp_commentmeta_comment_id ON wp_commentmeta(comment_id);
CREATE INDEX IF NOT EXISTS idx_wp_commentmeta_meta_key ON wp_commentmeta(meta_key);

CREATE INDEX IF NOT EXISTS idx_wp_terms_name ON wp_terms(name);

CREATE INDEX IF NOT EXISTS idx_wp_termmeta_term_id ON wp_termmeta(term_id);
CREATE INDEX IF NOT EXISTS idx_wp_termmeta_meta_key ON wp_termmeta(meta_key);

CREATE INDEX IF NOT EXISTS idx_wp_term_taxonomy_taxonomy ON wp_term_taxonomy(taxonomy);
CREATE INDEX IF NOT EXISTS idx_wp_term_taxonomy_parent ON wp_term_taxonomy(parent);

CREATE INDEX IF NOT EXISTS idx_wp_term_relationships_term_taxonomy_id ON wp_term_relationships(term_taxonomy_id);

CREATE INDEX IF NOT EXISTS idx_wp_usermeta_user_id ON wp_usermeta(user_id);
CREATE INDEX IF NOT EXISTS idx_wp_usermeta_meta_key ON wp_usermeta(meta_key);

CREATE INDEX IF NOT EXISTS idx_wp_options_autoload ON wp_options(autoload);

CREATE INDEX IF NOT EXISTS idx_wp_links_owner ON wp_links(link_owner);
