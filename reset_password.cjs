const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('yumi.db');
const hash = bcrypt.hashSync('admin123', 10);

db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, 'admin');
console.log('Password reset to admin123 for user admin');
