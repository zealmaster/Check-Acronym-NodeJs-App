import mysql2 from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const options = {
  host: process.env.MYSQSL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  multipleStatements: true
}; 

export let db = await mysql2.createConnection(options); 

export async function initializeDatabase() {
  const createDbSql = `
    CREATE DATABASE IF NOT EXISTS akronym;
  `;
  try {
    await db.query(createDbSql);
    console.log('Database created or already exists');
  } catch (error) {
    console.error('Error creating database:', error);
    return;
  }

  // Reconnect with the database specified
  options.database = 'akronym';
  db = await mysql2.createConnection(options);

  const createTablesSql = `
  CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT NOT NULL,
    email VARCHAR(100) UNIQUE, 
    password VARCHAR(100),
    firstname VARCHAR(100), 
    lastname VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS akronyms (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT NOT NULL,
    acronym VARCHAR(255) NOT NULL, 
    meaning VARCHAR(255) NOT NULL, 
    definition TEXT,
    subject_area VARCHAR(255) NOT NULL,
    author_id BIGINT UNSIGNED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_author_id FOREIGN KEY (author_id) REFERENCES users(id),
    CONSTRAINT UNIQUE_acronym_subject_area UNIQUE (acronym, subject_area) -- Unique constraint
  );

  CREATE TABLE IF NOT EXISTS comments (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT NOT NULL,
    acronym_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NOT NULL,
    comment VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_acronym_id FOREIGN KEY (acronym_id) REFERENCES akronyms(id),
    CONSTRAINT FK_comment_author_id FOREIGN KEY (author_id) REFERENCES users(id)
  );

  INSERT INTO users (firstname, lastname, email, password) 
  VALUES ('John', 'Doe', 'johndoe@checkacronym.com', 'passwordbutcannotlogin')
  ON DUPLICATE KEY UPDATE id=id;

  INSERT INTO akronyms (acronym, meaning, definition, subject_area, author_id) 
  VALUES ('KI', 'Kingsley Ijuo', 'The nickname of Kingsley Ijuo Onah', 'General', 1)
  ON DUPLICATE KEY UPDATE id=id;
`; 

try {
  await db.query(createTablesSql);
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Error initializing database:', error);
}
}

// Query function
export const queryDb = async (sql) => {
  const [result] = await db.query(sql);
  return result
  }