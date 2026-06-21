const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'news');
const COMPETITION_UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'competitions');
const DOCUMENT_UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'documents');
const CLUB_UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'clubs');
const GALLERY_UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'gallery');
const NATIONAL_TEAM_UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'national-team');
const DB_PATH = path.join(DATA_DIR, 'bfsa.sqlite');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(COMPETITION_UPLOAD_DIR)) fs.mkdirSync(COMPETITION_UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DOCUMENT_UPLOAD_DIR)) fs.mkdirSync(DOCUMENT_UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(CLUB_UPLOAD_DIR)) fs.mkdirSync(CLUB_UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(GALLERY_UPLOAD_DIR)) fs.mkdirSync(GALLERY_UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(NATIONAL_TEAM_UPLOAD_DIR)) fs.mkdirSync(NATIONAL_TEAM_UPLOAD_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname).toLowerCase();
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed.'));
    cb(null, true);
  }
});

const competitionStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, COMPETITION_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname).toLowerCase();
    cb(null, safeName);
  }
});

const competitionUpload = multer({
  storage: competitionStorage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';
    if (!isImage && !isPdf) return cb(new Error('Only images and PDF documents are allowed.'));
    cb(null, true);
  }
});

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DOCUMENT_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname).toLowerCase();
    cb(null, safeName);
  }
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF documents are allowed.'));
    cb(null, true);
  }
});

const clubStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CLUB_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname).toLowerCase();
    cb(null, safeName);
  }
});

const clubUpload = multer({
  storage: clubStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only club logo image uploads are allowed.'));
    cb(null, true);
  }
});

const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, GALLERY_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname).toLowerCase();
    cb(null, safeName);
  }
});

const galleryUpload = multer({
  storage: galleryStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed.'));
    cb(null, true);
  }
});

const nationalTeamStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, NATIONAL_TEAM_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname).toLowerCase();
    cb(null, safeName);
  }
});

const nationalTeamUpload = multer({
  storage: nationalTeamStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed.'));
    cb(null, true);
  }
});

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'news';
}


db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Новини',
    image_path TEXT,
    featured INTEGER DEFAULT 0,
    author_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);


  db.run(`CREATE TABLE IF NOT EXISTS competitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    city TEXT,
    country TEXT,
    venue TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    category TEXT DEFAULT 'Състезание',
    status TEXT DEFAULT 'upcoming',
    short_description TEXT,
    description TEXT,
    poster_path TEXT,
    bulletin_path TEXT,
    website_url TEXT,
    live_stream_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'other',
    description TEXT,
    file_path TEXT NOT NULL,
    original_filename TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    coach TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    facebook TEXT,
    short_description TEXT,
    description TEXT,
    logo_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);


  db.run(`CREATE TABLE IF NOT EXISTS gallery_albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS gallery_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    image_path TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS national_team_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    age_group TEXT NOT NULL,
    category TEXT NOT NULL,
    athlete1 TEXT NOT NULL,
    athlete2 TEXT,
    athlete3 TEXT,
    athlete4 TEXT,
    club TEXT,
    coach TEXT,
    achievements TEXT,
    description TEXT,
    instagram TEXT,
    photo_path TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.get('SELECT COUNT(*) AS count FROM admins', async (err, row) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      const hash = await bcrypt.hash('admin123', 12);
      db.run(
        'INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Main Admin', 'admin@bfsa.bg', hash, 'super_admin'],
        () => console.log('Default admin created: admin@bfsa.bg / admin123')
      );
    }
  });
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: DATA_DIR }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 4
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

function requireLogin(req, res, next) {
  if (!req.session.admin && !req.session.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect('/login');
  next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect('/login');
  if (req.session.admin.role !== 'super_admin') return res.status(403).send('Only super admins can do this.');
  next();
}

function getAdminByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM admins WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
  });
}

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
  });
}

function getAdmins() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, name, email, role, created_at FROM admins ORDER BY created_at DESC', [], (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function getNews(limit = 50) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM news ORDER BY featured DESC, created_at DESC LIMIT ?', [limit], (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function getNewsById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM news WHERE id = ?', [id], (err, row) => err ? reject(err) : resolve(row));
  });
}

function getNewsBySlug(slug) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM news WHERE slug = ?', [slug], (err, row) => err ? reject(err) : resolve(row));
  });
}

async function uniqueSlug(title, currentId = null) {
  const base = slugify(title);
  let slug = base;
  let i = 2;
  while (true) {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM news WHERE slug = ?', [slug], (err, found) => err ? reject(err) : resolve(found));
    });
    if (!row || Number(row.id) === Number(currentId)) return slug;
    slug = `${base}-${i++}`;
  }
}


function getCompetitions(limit = 100) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM competitions ORDER BY date(start_date) ASC, created_at DESC LIMIT ?', [limit], (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function getUpcomingCompetitions(limit = 6) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM competitions
            WHERE status = 'upcoming' AND date(start_date) >= date('now')
            ORDER BY date(start_date) ASC LIMIT ?`, [limit], (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function getCompetitionById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM competitions WHERE id = ?', [id], (err, row) => err ? reject(err) : resolve(row));
  });
}

function getCompetitionBySlug(slug) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM competitions WHERE slug = ?', [slug], (err, row) => err ? reject(err) : resolve(row));
  });
}

async function uniqueCompetitionSlug(title, currentId = null) {
  const base = slugify(title).replace(/^news$/, 'competition') || 'competition';
  let slug = base;
  let i = 2;
  while (true) {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM competitions WHERE slug = ?', [slug], (err, found) => err ? reject(err) : resolve(found));
    });
    if (!row || Number(row.id) === Number(currentId)) return slug;
    slug = `${base}-${i++}`;
  }
}

function getDocuments(limit = 200) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM documents ORDER BY category ASC, created_at DESC LIMIT ?', [limit], (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function getDocumentById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => err ? reject(err) : resolve(row));
  });
}

async function uniqueDocumentSlug(title, currentId = null) {
  const base = slugify(title).replace(/^news$/, 'document') || 'document';
  let slug = base;
  let i = 2;
  while (true) {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM documents WHERE slug = ?', [slug], (err, found) => err ? reject(err) : resolve(found));
    });
    if (!row || Number(row.id) === Number(currentId)) return slug;
    slug = `${base}-${i++}`;
  }
}

const DOCUMENT_CATEGORIES = [
  { value: 'calendar', label: 'Календар' },
  { value: 'regulations', label: 'Наредби и правилници' },
  { value: 'bulletins', label: 'Бюлетини' },
  { value: 'forms', label: 'Формуляри' },
  { value: 'national-team', label: 'Национален отбор' },
  { value: 'results', label: 'Резултати' },
  { value: 'other', label: 'Други' }
];

function categoryLabel(value) {
  return (DOCUMENT_CATEGORIES.find(c => c.value === value) || DOCUMENT_CATEGORIES[DOCUMENT_CATEGORIES.length - 1]).label;
}

function getClubs(limit = 300) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM clubs ORDER BY city ASC, name ASC LIMIT ?', [limit], (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function getClubById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM clubs WHERE id = ?', [id], (err, row) => err ? reject(err) : resolve(row));
  });
}

function getClubBySlug(slug) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM clubs WHERE slug = ?', [slug], (err, row) => err ? reject(err) : resolve(row));
  });
}

async function uniqueClubSlug(name, currentId = null) {
  const base = slugify(name).replace(/^news$/, 'club') || 'club';
  let slug = base;
  let i = 2;
  while (true) {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM clubs WHERE slug = ?', [slug], (err, found) => err ? reject(err) : resolve(found));
    });
    if (!row || Number(row.id) === Number(currentId)) return slug;
    slug = `${base}-${i++}`;
  }
}


function getAlbums(limit = 300) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT a.*, COUNT(p.id) AS photo_count
            FROM gallery_albums a
            LEFT JOIN gallery_photos p ON p.album_id = a.id
            GROUP BY a.id
            ORDER BY a.created_at DESC
            LIMIT ?`, [limit], (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function getAlbumById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM gallery_albums WHERE id = ?', [id], (err, row) => err ? reject(err) : resolve(row));
  });
}

function getAlbumBySlug(slug) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM gallery_albums WHERE slug = ?', [slug], (err, row) => err ? reject(err) : resolve(row));
  });
}

function getPhotosByAlbumId(albumId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM gallery_photos WHERE album_id = ? ORDER BY sort_order ASC, created_at DESC', [albumId], (err, rows) => err ? reject(err) : resolve(rows));
  });
}

async function uniqueAlbumSlug(title, currentId = null) {
  const base = slugify(title).replace(/^news$/, 'album') || 'album';
  let slug = base;
  let i = 2;
  while (true) {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM gallery_albums WHERE slug = ?', [slug], (err, found) => err ? reject(err) : resolve(found));
    });
    if (!row || Number(row.id) === Number(currentId)) return slug;
    slug = `${base}-${i++}`;
  }
}


const NATIONAL_TEAM_AGE_GROUPS = [
  { value: 'pre-youth', label: 'Pre-Youth (11–16)' },
  { value: 'youth', label: 'Youth (12–18)' },
  { value: 'juniors', label: 'Juniors (13–19)' },
  { value: 'seniors', label: 'Seniors' }
];

const NATIONAL_TEAM_CATEGORIES = [
  { value: 'womens-pair', label: "Women's Pair" },
  { value: 'mens-pair', label: "Men's Pair" },
  { value: 'mixed-pair', label: 'Mixed Pair' },
  { value: 'womens-group', label: "Women's Group" },
  { value: 'mens-group', label: "Men's Group" }
];

function ageGroupLabel(value) {
  return (NATIONAL_TEAM_AGE_GROUPS.find(g => g.value === value) || {}).label || value;
}

function ntCategoryLabel(value) {
  return (NATIONAL_TEAM_CATEGORIES.find(c => c.value === value) || {}).label || value;
}

function getNationalTeamEntries(limit = 500) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM national_team_entries ORDER BY sort_order ASC, age_group ASC, category ASC, created_at DESC LIMIT ?', [limit], (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function getNationalTeamEntryById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM national_team_entries WHERE id = ?', [id], (err, row) => err ? reject(err) : resolve(row));
  });
}

function getNationalTeamEntryBySlug(slug) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM national_team_entries WHERE slug = ?', [slug], (err, row) => err ? reject(err) : resolve(row));
  });
}

async function uniqueNationalTeamSlug(title, currentId = null) {
  const base = slugify(title).replace(/^news$/, 'team') || 'team';
  let slug = base;
  let i = 2;
  while (true) {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM national_team_entries WHERE slug = ?', [slug], (err, found) => err ? reject(err) : resolve(found));
    });
    if (!row || Number(row.id) === Number(currentId)) return slug;
    slug = `${base}-${i++}`;
  }
}

app.get('/api/me', (req, res) => {
  if (req.session.admin) return res.json({ user: req.session.admin, type: 'admin' });
  if (req.session.user) return res.json({ user: req.session.user, type: 'user' });
  res.json({ user: null });
});

app.get('/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  if (req.session.user) return res.redirect('/profile');
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await getAdminByEmail(email || '');
    if (admin) {
      const ok = await bcrypt.compare(password || '', admin.password_hash);
      if (!ok) return res.status(401).render('login', { error: 'Wrong email or password.' });

      req.session.admin = { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
      return res.redirect('/admin');
    }

    const user = await getUserByEmail(email || '');
    if (!user) return res.status(401).render('login', { error: 'Wrong email or password.' });

    const ok = await bcrypt.compare(password || '', user.password_hash);
    if (!ok) return res.status(401).render('login', { error: 'Wrong email or password.' });

    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.redirect('/profile');
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.get('/register', (req, res) => {
  if (req.session.admin || req.session.user) return res.redirect('/profile');
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    return res.status(400).render('register', { error: 'All fields are required.' });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).render('register', { error: 'Passwords do not match.' });
  }

  try {
    const existingAdmin = await getAdminByEmail(email);
    const existingUser = await getUserByEmail(email);
    if (existingAdmin || existingUser) {
      return res.status(400).render('register', { error: 'Email already exists.' });
    }

    const hash = await bcrypt.hash(password, 12);
    db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, 'user'],
      function (err) {
        if (err) return res.status(400).render('register', { error: 'Email already exists.' });

        req.session.user = { id: this.lastID, name, email, role: 'user' };
        res.redirect('/profile');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.get('/profile', requireLogin, (req, res) => {
  const account = req.session.admin || req.session.user;
  res.render('profile', { account, isAdmin: Boolean(req.session.admin) });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/admin', requireAdmin, async (req, res) => {
  const admins = await getAdmins();
  res.render('admin', { currentAdmin: req.session.admin, admins, error: null, success: null });
});

app.post('/admin/profiles', requireSuperAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  const admins = await getAdmins();

  if (!name || !email || !password) {
    return res.status(400).render('admin', { currentAdmin: req.session.admin, admins, error: 'Name, email and password are required.', success: null });
  }

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).render('admin', { currentAdmin: req.session.admin, admins, error: 'This email already exists as a user.', success: null });
    }

    const hash = await bcrypt.hash(password, 12);
    db.run(
      'INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role === 'super_admin' ? 'super_admin' : 'admin'],
      async (err) => {
        if (err) {
          const freshAdmins = await getAdmins();
          return res.status(400).render('admin', { currentAdmin: req.session.admin, admins: freshAdmins, error: 'Email already exists.', success: null });
        }
        res.redirect('/admin?created=1');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.post('/admin/profiles/:id/delete', requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.session.admin.id) return res.status(400).send('You cannot delete your own account while logged in.');
  db.run('DELETE FROM admins WHERE id = ?', [id], () => res.redirect('/admin'));
});


app.get('/api/news', async (req, res) => {
  try {
    const news = await getNews(6);
    res.json(news);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});


app.get('/news', async (req, res) => {
  try {
    const news = await getNews(200);
    res.render('news_list', { news });
  } catch (e) {
    console.error(e);
    res.status(500).send('Could not load news.');
  }
});

app.get('/news/:slug', async (req, res) => {
  const article = await getNewsBySlug(req.params.slug);
  if (!article) return res.status(404).send('News article not found.');
  res.render('news_detail', { article });
});

app.get('/admin/news', requireAdmin, async (req, res) => {
  const news = await getNews(100);
  res.render('admin_news', { currentAdmin: req.session.admin, news, error: null });
});

app.get('/admin/news/new', requireAdmin, (req, res) => {
  res.render('news_form', { currentAdmin: req.session.admin, article: null, error: null });
});

app.post('/admin/news', requireAdmin, upload.single('image'), async (req, res) => {
  const { title, summary, content, category, featured } = req.body;
  if (!title || !summary || !content) {
    return res.status(400).render('news_form', { currentAdmin: req.session.admin, article: req.body, error: 'Title, summary and content are required.' });
  }
  try {
    const slug = await uniqueSlug(title);
    const imagePath = req.file ? `/uploads/news/${req.file.filename}` : null;
    db.run(
      `INSERT INTO news (title, slug, summary, content, category, image_path, featured, author_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, summary, content, category || 'Новини', imagePath, featured ? 1 : 0, req.session.admin.name],
      (err) => {
        if (err) return res.status(500).send('Could not save news.');
        res.redirect('/admin/news');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.get('/admin/news/:id/edit', requireAdmin, async (req, res) => {
  const article = await getNewsById(req.params.id);
  if (!article) return res.status(404).send('News article not found.');
  res.render('news_form', { currentAdmin: req.session.admin, article, error: null });
});

app.post('/admin/news/:id/edit', requireAdmin, upload.single('image'), async (req, res) => {
  const article = await getNewsById(req.params.id);
  if (!article) return res.status(404).send('News article not found.');

  const { title, summary, content, category, featured } = req.body;
  if (!title || !summary || !content) {
    return res.status(400).render('news_form', { currentAdmin: req.session.admin, article: { ...article, ...req.body }, error: 'Title, summary and content are required.' });
  }

  try {
    const slug = await uniqueSlug(title, article.id);
    const imagePath = req.file ? `/uploads/news/${req.file.filename}` : article.image_path;
    db.run(
      `UPDATE news SET title = ?, slug = ?, summary = ?, content = ?, category = ?, image_path = ?, featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title, slug, summary, content, category || 'Новини', imagePath, featured ? 1 : 0, article.id],
      (err) => {
        if (err) return res.status(500).send('Could not update news.');
        res.redirect('/admin/news');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.post('/admin/news/:id/delete', requireAdmin, async (req, res) => {
  const article = await getNewsById(req.params.id);
  if (article && article.image_path) {
    const filePath = path.join(__dirname, 'public', article.image_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.run('DELETE FROM news WHERE id = ?', [req.params.id], () => res.redirect('/admin/news'));
});


// Competition public API and pages
app.get('/api/competitions/upcoming', async (req, res) => {
  try {
    const competitions = await getUpcomingCompetitions(3);
    res.json(competitions);
  } catch (e) {
    console.error(e);
    res.status(500).json([]);
  }
});

app.get('/competitions', async (req, res) => {
  try {
    const all = await getCompetitions(200);
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = all.filter(c => c.status === 'upcoming' && c.start_date >= today);
    const past = all.filter(c => c.status !== 'upcoming' || c.start_date < today).sort((a, b) => String(b.start_date).localeCompare(String(a.start_date)));
    res.render('competitions_list', { upcoming, past });
  } catch (e) {
    console.error(e);
    res.status(500).send('Could not load competitions.');
  }
});

app.get('/competitions/:slug', async (req, res) => {
  const competition = await getCompetitionBySlug(req.params.slug);
  if (!competition) return res.status(404).send('Competition not found.');
  res.render('competition_detail', { competition });
});

// Competition admin
app.get('/admin/competitions', requireAdmin, async (req, res) => {
  const competitions = await getCompetitions(200);
  res.render('admin_competitions', { currentAdmin: req.session.admin, competitions, error: null });
});

app.get('/admin/competitions/new', requireAdmin, (req, res) => {
  res.render('competition_form', { currentAdmin: req.session.admin, competition: null, error: null });
});

app.post('/admin/competitions', requireAdmin, competitionUpload.fields([{ name: 'poster', maxCount: 1 }, { name: 'bulletin', maxCount: 1 }]), async (req, res) => {
  const { title, city, country, venue, start_date, end_date, category, status, short_description, description, website_url, live_stream_url } = req.body;
  if (!title || !start_date) {
    return res.status(400).render('competition_form', { currentAdmin: req.session.admin, competition: req.body, error: 'Title and start date are required.' });
  }
  try {
    const slug = await uniqueCompetitionSlug(title);
    const posterPath = req.files && req.files.poster ? `/uploads/competitions/${req.files.poster[0].filename}` : null;
    const bulletinPath = req.files && req.files.bulletin ? `/uploads/competitions/${req.files.bulletin[0].filename}` : null;
    db.run(
      `INSERT INTO competitions (title, slug, city, country, venue, start_date, end_date, category, status, short_description, description, poster_path, bulletin_path, website_url, live_stream_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, city || '', country || '', venue || '', start_date, end_date || start_date, category || 'Състезание', status || 'upcoming', short_description || '', description || '', posterPath, bulletinPath, website_url || '', live_stream_url || ''],
      (err) => {
        if (err) return res.status(500).send('Could not save competition.');
        res.redirect('/admin/competitions');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.get('/admin/competitions/:id/edit', requireAdmin, async (req, res) => {
  const competition = await getCompetitionById(req.params.id);
  if (!competition) return res.status(404).send('Competition not found.');
  res.render('competition_form', { currentAdmin: req.session.admin, competition, error: null });
});

app.post('/admin/competitions/:id/edit', requireAdmin, competitionUpload.fields([{ name: 'poster', maxCount: 1 }, { name: 'bulletin', maxCount: 1 }]), async (req, res) => {
  const competition = await getCompetitionById(req.params.id);
  if (!competition) return res.status(404).send('Competition not found.');
  const { title, city, country, venue, start_date, end_date, category, status, short_description, description, website_url, live_stream_url } = req.body;
  if (!title || !start_date) {
    return res.status(400).render('competition_form', { currentAdmin: req.session.admin, competition: { ...competition, ...req.body }, error: 'Title and start date are required.' });
  }
  try {
    const slug = await uniqueCompetitionSlug(title, competition.id);
    const posterPath = req.files && req.files.poster ? `/uploads/competitions/${req.files.poster[0].filename}` : competition.poster_path;
    const bulletinPath = req.files && req.files.bulletin ? `/uploads/competitions/${req.files.bulletin[0].filename}` : competition.bulletin_path;
    db.run(
      `UPDATE competitions SET title = ?, slug = ?, city = ?, country = ?, venue = ?, start_date = ?, end_date = ?, category = ?, status = ?, short_description = ?, description = ?, poster_path = ?, bulletin_path = ?, website_url = ?, live_stream_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title, slug, city || '', country || '', venue || '', start_date, end_date || start_date, category || 'Състезание', status || 'upcoming', short_description || '', description || '', posterPath, bulletinPath, website_url || '', live_stream_url || '', competition.id],
      (err) => {
        if (err) return res.status(500).send('Could not update competition.');
        res.redirect('/admin/competitions');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.post('/admin/competitions/:id/delete', requireAdmin, async (req, res) => {
  const competition = await getCompetitionById(req.params.id);
  for (const fileUrl of [competition && competition.poster_path, competition && competition.bulletin_path]) {
    if (fileUrl) {
      const filePath = path.join(__dirname, 'public', fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
  db.run('DELETE FROM competitions WHERE id = ?', [req.params.id], () => res.redirect('/admin/competitions'));
});


// Documents public pages
app.get('/documents', async (req, res) => {
  try {
    const documents = await getDocuments(300);
    res.render('documents_list', { documents, categories: DOCUMENT_CATEGORIES, categoryLabel });
  } catch (e) {
    console.error(e);
    res.status(500).send('Could not load documents.');
  }
});

// Documents admin
app.get('/admin/documents', requireAdmin, async (req, res) => {
  const documents = await getDocuments(300);
  res.render('admin_documents', { currentAdmin: req.session.admin, documents, categories: DOCUMENT_CATEGORIES, categoryLabel, error: null });
});

app.get('/admin/documents/new', requireAdmin, (req, res) => {
  res.render('document_form', { currentAdmin: req.session.admin, document: null, categories: DOCUMENT_CATEGORIES, error: null });
});

app.post('/admin/documents', requireAdmin, documentUpload.single('file'), async (req, res) => {
  const { title, category, description } = req.body;
  if (!title || !req.file) {
    return res.status(400).render('document_form', { currentAdmin: req.session.admin, document: req.body, categories: DOCUMENT_CATEGORIES, error: 'Title and PDF file are required.' });
  }
  try {
    const slug = await uniqueDocumentSlug(title);
    const filePath = `/uploads/documents/${req.file.filename}`;
    db.run(
      `INSERT INTO documents (title, slug, category, description, file_path, original_filename)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, slug, category || 'other', description || '', filePath, req.file.originalname || 'document.pdf'],
      (err) => {
        if (err) return res.status(500).send('Could not save document.');
        res.redirect('/admin/documents');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.get('/admin/documents/:id/edit', requireAdmin, async (req, res) => {
  const document = await getDocumentById(req.params.id);
  if (!document) return res.status(404).send('Document not found.');
  res.render('document_form', { currentAdmin: req.session.admin, document, categories: DOCUMENT_CATEGORIES, error: null });
});

app.post('/admin/documents/:id/edit', requireAdmin, documentUpload.single('file'), async (req, res) => {
  const document = await getDocumentById(req.params.id);
  if (!document) return res.status(404).send('Document not found.');
  const { title, category, description } = req.body;
  if (!title) {
    return res.status(400).render('document_form', { currentAdmin: req.session.admin, document: { ...document, ...req.body }, categories: DOCUMENT_CATEGORIES, error: 'Title is required.' });
  }
  try {
    const slug = await uniqueDocumentSlug(title, document.id);
    let filePath = document.file_path;
    let originalFilename = document.original_filename;
    if (req.file) {
      if (document.file_path) {
        const oldFilePath = path.join(__dirname, 'public', document.file_path);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      filePath = `/uploads/documents/${req.file.filename}`;
      originalFilename = req.file.originalname || 'document.pdf';
    }
    db.run(
      `UPDATE documents SET title = ?, slug = ?, category = ?, description = ?, file_path = ?, original_filename = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title, slug, category || 'other', description || '', filePath, originalFilename, document.id],
      (err) => {
        if (err) return res.status(500).send('Could not update document.');
        res.redirect('/admin/documents');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.post('/admin/documents/:id/delete', requireAdmin, async (req, res) => {
  const document = await getDocumentById(req.params.id);
  if (document && document.file_path) {
    const filePath = path.join(__dirname, 'public', document.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.run('DELETE FROM documents WHERE id = ?', [req.params.id], () => res.redirect('/admin/documents'));
});


// Public quick-link pages
function getDocumentsByCategory(category) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM documents WHERE category = ? ORDER BY created_at DESC', [category], (err, rows) => err ? reject(err) : resolve(rows));
  });
}

// National Team public pages
app.get('/national-team', async (req, res) => {
  try {
    const entries = await getNationalTeamEntries(500);
    res.render('national_team_list', { entries, ageGroups: NATIONAL_TEAM_AGE_GROUPS, categories: NATIONAL_TEAM_CATEGORIES, ageGroupLabel, ntCategoryLabel });
  } catch (e) {
    console.error(e);
    res.status(500).send('Could not load national team.');
  }
});

app.get('/national-team/:slug', async (req, res) => {
  const entry = await getNationalTeamEntryBySlug(req.params.slug);
  if (!entry) return res.status(404).send('National team entry not found.');
  res.render('national_team_detail', { entry, ageGroupLabel, ntCategoryLabel });
});

// National Team admin
app.get('/admin/national-team', requireAdmin, async (req, res) => {
  const entries = await getNationalTeamEntries(500);
  res.render('admin_national_team', { currentAdmin: req.session.admin, entries, ageGroupLabel, ntCategoryLabel, error: null });
});

app.get('/admin/national-team/new', requireAdmin, (req, res) => {
  res.render('national_team_form', { currentAdmin: req.session.admin, entry: null, ageGroups: NATIONAL_TEAM_AGE_GROUPS, categories: NATIONAL_TEAM_CATEGORIES, error: null });
});

app.post('/admin/national-team', requireAdmin, nationalTeamUpload.single('photo'), async (req, res) => {
  const { title, age_group, category, athlete1, athlete2, athlete3, athlete4, club, coach, achievements, description, instagram, sort_order } = req.body;
  if (!title || !age_group || !category || !athlete1) {
    return res.status(400).render('national_team_form', { currentAdmin: req.session.admin, entry: req.body, ageGroups: NATIONAL_TEAM_AGE_GROUPS, categories: NATIONAL_TEAM_CATEGORIES, error: 'Title, age group, category and at least Athlete 1 are required.' });
  }
  try {
    const slug = await uniqueNationalTeamSlug(title);
    const photoPath = req.file ? `/uploads/national-team/${req.file.filename}` : null;
    db.run(
      `INSERT INTO national_team_entries (title, slug, age_group, category, athlete1, athlete2, athlete3, athlete4, club, coach, achievements, description, instagram, photo_path, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, age_group, category, athlete1, athlete2 || '', athlete3 || '', athlete4 || '', club || '', coach || '', achievements || '', description || '', instagram || '', photoPath, Number(sort_order || 0)],
      (err) => {
        if (err) return res.status(500).send('Could not save national team entry.');
        res.redirect('/admin/national-team');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.get('/admin/national-team/:id/edit', requireAdmin, async (req, res) => {
  const entry = await getNationalTeamEntryById(req.params.id);
  if (!entry) return res.status(404).send('National team entry not found.');
  res.render('national_team_form', { currentAdmin: req.session.admin, entry, ageGroups: NATIONAL_TEAM_AGE_GROUPS, categories: NATIONAL_TEAM_CATEGORIES, error: null });
});

app.post('/admin/national-team/:id/edit', requireAdmin, nationalTeamUpload.single('photo'), async (req, res) => {
  const entry = await getNationalTeamEntryById(req.params.id);
  if (!entry) return res.status(404).send('National team entry not found.');
  const { title, age_group, category, athlete1, athlete2, athlete3, athlete4, club, coach, achievements, description, instagram, sort_order } = req.body;
  if (!title || !age_group || !category || !athlete1) {
    return res.status(400).render('national_team_form', { currentAdmin: req.session.admin, entry: { ...entry, ...req.body }, ageGroups: NATIONAL_TEAM_AGE_GROUPS, categories: NATIONAL_TEAM_CATEGORIES, error: 'Title, age group, category and at least Athlete 1 are required.' });
  }
  try {
    const slug = await uniqueNationalTeamSlug(title, entry.id);
    let photoPath = entry.photo_path;
    if (req.file) {
      if (entry.photo_path) {
        const oldFilePath = path.join(__dirname, 'public', entry.photo_path);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      photoPath = `/uploads/national-team/${req.file.filename}`;
    }
    db.run(
      `UPDATE national_team_entries SET title = ?, slug = ?, age_group = ?, category = ?, athlete1 = ?, athlete2 = ?, athlete3 = ?, athlete4 = ?, club = ?, coach = ?, achievements = ?, description = ?, instagram = ?, photo_path = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title, slug, age_group, category, athlete1, athlete2 || '', athlete3 || '', athlete4 || '', club || '', coach || '', achievements || '', description || '', instagram || '', photoPath, Number(sort_order || 0), entry.id],
      (err) => {
        if (err) return res.status(500).send('Could not update national team entry.');
        res.redirect('/admin/national-team');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.post('/admin/national-team/:id/delete', requireAdmin, async (req, res) => {
  const entry = await getNationalTeamEntryById(req.params.id);
  if (entry && entry.photo_path) {
    const filePath = path.join(__dirname, 'public', entry.photo_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.run('DELETE FROM national_team_entries WHERE id = ?', [req.params.id], () => res.redirect('/admin/national-team'));
});

// Clubs public pages
app.get('/clubs', async (req, res) => {
  try {
    const clubs = await getClubs(300);
    const cities = [...new Set(clubs.map(c => c.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'bg'));
    res.render('clubs_list', { clubs, cities });
  } catch (e) {
    console.error(e);
    res.status(500).send('Could not load clubs.');
  }
});

app.get('/clubs/:slug', async (req, res) => {
  const club = await getClubBySlug(req.params.slug);
  if (!club) return res.status(404).send('Club not found.');
  res.render('club_detail', { club });
});

// Clubs admin
app.get('/admin/clubs', requireAdmin, async (req, res) => {
  const clubs = await getClubs(300);
  res.render('admin_clubs', { currentAdmin: req.session.admin, clubs, error: null });
});

app.get('/admin/clubs/new', requireAdmin, (req, res) => {
  res.render('club_form', { currentAdmin: req.session.admin, club: null, error: null });
});

app.post('/admin/clubs', requireAdmin, clubUpload.single('logo'), async (req, res) => {
  const { name, city, coach, address, phone, email, website, instagram, facebook, short_description, description } = req.body;
  if (!name || !city) {
    return res.status(400).render('club_form', { currentAdmin: req.session.admin, club: req.body, error: 'Club name and city are required.' });
  }
  try {
    const slug = await uniqueClubSlug(name);
    const logoPath = req.file ? `/uploads/clubs/${req.file.filename}` : null;
    db.run(
      `INSERT INTO clubs (name, slug, city, coach, address, phone, email, website, instagram, facebook, short_description, description, logo_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, city, coach || '', address || '', phone || '', email || '', website || '', instagram || '', facebook || '', short_description || '', description || '', logoPath],
      (err) => {
        if (err) return res.status(500).send('Could not save club.');
        res.redirect('/admin/clubs');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.get('/admin/clubs/:id/edit', requireAdmin, async (req, res) => {
  const club = await getClubById(req.params.id);
  if (!club) return res.status(404).send('Club not found.');
  res.render('club_form', { currentAdmin: req.session.admin, club, error: null });
});

app.post('/admin/clubs/:id/edit', requireAdmin, clubUpload.single('logo'), async (req, res) => {
  const club = await getClubById(req.params.id);
  if (!club) return res.status(404).send('Club not found.');
  const { name, city, coach, address, phone, email, website, instagram, facebook, short_description, description } = req.body;
  if (!name || !city) {
    return res.status(400).render('club_form', { currentAdmin: req.session.admin, club: { ...club, ...req.body }, error: 'Club name and city are required.' });
  }
  try {
    const slug = await uniqueClubSlug(name, club.id);
    let logoPath = club.logo_path;
    if (req.file) {
      if (club.logo_path) {
        const oldLogoPath = path.join(__dirname, 'public', club.logo_path);
        if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
      }
      logoPath = `/uploads/clubs/${req.file.filename}`;
    }
    db.run(
      `UPDATE clubs SET name = ?, slug = ?, city = ?, coach = ?, address = ?, phone = ?, email = ?, website = ?, instagram = ?, facebook = ?, short_description = ?, description = ?, logo_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, slug, city, coach || '', address || '', phone || '', email || '', website || '', instagram || '', facebook || '', short_description || '', description || '', logoPath, club.id],
      (err) => {
        if (err) return res.status(500).send('Could not update club.');
        res.redirect('/admin/clubs');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.post('/admin/clubs/:id/delete', requireAdmin, async (req, res) => {
  const club = await getClubById(req.params.id);
  if (club && club.logo_path) {
    const logoPath = path.join(__dirname, 'public', club.logo_path);
    if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
  }
  db.run('DELETE FROM clubs WHERE id = ?', [req.params.id], () => res.redirect('/admin/clubs'));
});


// Gallery public pages
app.get('/gallery', async (req, res) => {
  try {
    const albums = await getAlbums(300);
    res.render('gallery_list', { albums });
  } catch (e) {
    console.error(e);
    res.status(500).send('Could not load gallery.');
  }
});

app.get('/gallery/:slug', async (req, res) => {
  const album = await getAlbumBySlug(req.params.slug);
  if (!album) return res.status(404).send('Album not found.');
  const photos = await getPhotosByAlbumId(album.id);
  res.render('gallery_album', { album, photos });
});

// Gallery admin
app.get('/admin/gallery', requireAdmin, async (req, res) => {
  const albums = await getAlbums(300);
  res.render('admin_gallery', { currentAdmin: req.session.admin, albums, error: null });
});

app.get('/admin/gallery/new', requireAdmin, (req, res) => {
  res.render('gallery_album_form', { currentAdmin: req.session.admin, album: null, error: null });
});

app.post('/admin/gallery', requireAdmin, galleryUpload.single('cover'), async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).render('gallery_album_form', { currentAdmin: req.session.admin, album: req.body, error: 'Album title is required.' });
  }
  try {
    const slug = await uniqueAlbumSlug(title);
    const coverImage = req.file ? `/uploads/gallery/${req.file.filename}` : null;
    db.run(
      'INSERT INTO gallery_albums (title, slug, description, cover_image) VALUES (?, ?, ?, ?)',
      [title, slug, description || '', coverImage],
      (err) => {
        if (err) return res.status(500).send('Could not save album.');
        res.redirect('/admin/gallery');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.get('/admin/gallery/:id/edit', requireAdmin, async (req, res) => {
  const album = await getAlbumById(req.params.id);
  if (!album) return res.status(404).send('Album not found.');
  res.render('gallery_album_form', { currentAdmin: req.session.admin, album, error: null });
});

app.post('/admin/gallery/:id/edit', requireAdmin, galleryUpload.single('cover'), async (req, res) => {
  const album = await getAlbumById(req.params.id);
  if (!album) return res.status(404).send('Album not found.');
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).render('gallery_album_form', { currentAdmin: req.session.admin, album: { ...album, ...req.body }, error: 'Album title is required.' });
  }
  try {
    const slug = await uniqueAlbumSlug(title, album.id);
    let coverImage = album.cover_image;
    if (req.file) {
      if (album.cover_image) {
        const oldCover = path.join(__dirname, 'public', album.cover_image);
        if (fs.existsSync(oldCover)) fs.unlinkSync(oldCover);
      }
      coverImage = `/uploads/gallery/${req.file.filename}`;
    }
    db.run(
      'UPDATE gallery_albums SET title = ?, slug = ?, description = ?, cover_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, slug, description || '', coverImage, album.id],
      (err) => {
        if (err) return res.status(500).send('Could not update album.');
        res.redirect('/admin/gallery');
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

app.post('/admin/gallery/:id/delete', requireAdmin, async (req, res) => {
  const album = await getAlbumById(req.params.id);
  const photos = album ? await getPhotosByAlbumId(album.id) : [];
  photos.forEach(photo => {
    if (photo.image_path) {
      const photoPath = path.join(__dirname, 'public', photo.image_path);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }
  });
  if (album && album.cover_image) {
    const coverPath = path.join(__dirname, 'public', album.cover_image);
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
  }
  db.run('DELETE FROM gallery_photos WHERE album_id = ?', [req.params.id], () => {
    db.run('DELETE FROM gallery_albums WHERE id = ?', [req.params.id], () => res.redirect('/admin/gallery'));
  });
});

app.get('/admin/gallery/:id/photos', requireAdmin, async (req, res) => {
  const album = await getAlbumById(req.params.id);
  if (!album) return res.status(404).send('Album not found.');
  const photos = await getPhotosByAlbumId(album.id);
  res.render('admin_gallery_photos', { currentAdmin: req.session.admin, album, photos, error: null });
});

app.post('/admin/gallery/:id/photos', requireAdmin, galleryUpload.array('photos', 20), async (req, res) => {
  const album = await getAlbumById(req.params.id);
  if (!album) return res.status(404).send('Album not found.');
  if (!req.files || !req.files.length) return res.redirect(`/admin/gallery/${album.id}/photos`);
  const captions = Array.isArray(req.body.captions) ? req.body.captions : [];
  const stmt = db.prepare('INSERT INTO gallery_photos (album_id, image_path, caption, sort_order) VALUES (?, ?, ?, ?)');
  req.files.forEach((file, index) => {
    stmt.run(album.id, `/uploads/gallery/${file.filename}`, captions[index] || '', index);
  });
  stmt.finalize(() => res.redirect(`/admin/gallery/${album.id}/photos`));
});

app.post('/admin/gallery/photos/:photoId/delete', requireAdmin, async (req, res) => {
  db.get('SELECT * FROM gallery_photos WHERE id = ?', [req.params.photoId], (err, photo) => {
    if (!photo) return res.redirect('/admin/gallery');
    if (photo.image_path) {
      const photoPath = path.join(__dirname, 'public', photo.image_path);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }
    db.run('DELETE FROM gallery_photos WHERE id = ?', [photo.id], () => res.redirect(`/admin/gallery/${photo.album_id}/photos`));
  });
});


app.get('/about-acrobatics', (req, res) => {
  res.render('static_page', {
    title: 'За спортната акробатика',
    eyebrow: 'БФСА',
    description: 'Научете повече за спортната акробатика, дисциплините, възрастовите групи и ролята на Българската федерация по спортна акробатика в развитието на спорта у нас.',
    cards: [
      { icon: '<i class="fa-solid fa-person-running"></i>', title: 'Какво е спортна акробатика?', text: 'Динамичен и артистичен спорт, който съчетава сила, гъвкавост, баланс, музикалност и партньорска работа.' },
      { icon: '<i class="fa-solid fa-people-arrows"></i>', title: 'Дисциплини', text: 'Женска двойка, мъжка двойка, смесена двойка, женска група и мъжка група.' },
      { icon: '<i class="fa-solid fa-layer-group"></i>', title: 'Възрастови групи', text: 'Pre-Youth (11–16), Youth (12–18), Juniors (13–19) и Seniors.' },
      { icon: '<i class="fa-solid fa-medal"></i>', title: 'Български успехи', text: 'България има традиции, медалисти и клубове, които изграждат следващото поколение състезатели.' },
      { icon: '<i class="fa-solid fa-building-columns"></i>', title: 'Ролята на БФСА', text: 'Федерацията координира състезания, клубове, национални отбори, документи, правила и развитие на спорта.' },
      { icon: '<i class="fa-solid fa-location-dot"></i>', title: 'Как да започнете?', text: 'Посетете секцията „Клубове“, за да откриете спортен клуб по акробатика във вашия град.' }
    ]
  });
});

app.get('/results', async (req, res) => {
  const documents = await getDocumentsByCategory('results');
  res.render('static_page', {
    title: 'Резултати и класирания',
    eyebrow: 'Архив',
    description: 'Тук се публикуват официални резултати, класирания и протоколи от състезания. PDF файловете се добавят от админ панела чрез категория „Резултати“.',
    cards: [
      { icon: '<i class="fa-solid fa-ranking-star"></i>', title: 'Класирания', text: 'Официални класирания от държавни и международни състезания.' },
      { icon: '<i class="fa-solid fa-file-pdf"></i>', title: 'Протоколи', text: 'PDF протоколи и резултати, достъпни за изтегляне.' },
      { icon: '<i class="fa-solid fa-clock-rotate-left"></i>', title: 'Архив', text: 'Исторически резултати и документи от минали състезания.' }
    ],
    documents,
    categoryLabel
  });
});

app.listen(PORT, () => console.log(`BFSA backend running at http://localhost:${PORT}`));
