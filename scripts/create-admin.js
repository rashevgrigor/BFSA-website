const path = require('path');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const [name, email, password, role = 'admin'] = process.argv.slice(2);
if (!name || !email || !password) {
  console.log('Usage: npm run create-admin -- "Name" email@example.com password [admin|super_admin]');
  process.exit(1);
}

const db = new sqlite3.Database(path.join(__dirname, '..', 'data', 'bfsa.sqlite'));
db.serialize(async () => {
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  const hash = await bcrypt.hash(password, 12);
  db.run('INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, hash, role],
    (err) => {
      if (err) console.error('Could not create admin:', err.message);
      else console.log('Admin created.');
      db.close();
    });
});
