const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- Database Connection --------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }  <-- uncomment for Railway deployment
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Failed to connect to database:', err);
  } else {
    console.log('Successfully connected to database at:', res.rows[0].now);
  }
});

// -------------------- Routes --------------------
//login route
app.use(session({
  secret: 'secret', 
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,  
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

//registration 
app.post('/api/register', async (req, res) => {
  const { email, password, language } = req.body;

  if (!email || !password || !language) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existingUser = await pool.query('SELECT * FROM account WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Account with this email already exists' });
    }

    // const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(`
      INSERT INTO account (email, password, preferences, language)
      VALUES ($1, $2, '{}', $3)
    `, [email, password, language]);

    res.json({ message: 'Registration successful' });

  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).send('Server error');
  }
});


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM account WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.account_id;

    res.json({ message: 'Login successful' });

  } catch (err) {
    console.error('Database error during login:', err);
    res.status(500).send('Server error');
  }
});

app.get('/api/session', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, userId: req.session.userId });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

//Fetch profile by ID
app.get('/api/profile/:id', async (req, res) => {
  const profileId = req.params.id;

  try {
    const query = `
        SELECT 
          p.profile_id, 
          p.name, 
          p.reputation_points, 
          array_to_json(p.languages) AS languages, 
          array_agg(s.skill) AS skills
        FROM skill_profile p
        LEFT JOIN skill_listing s ON p.profile_id = s.profile_id
        WHERE p.profile_id = $1
        GROUP BY p.profile_id;
    `;

    const result = await pool.query(query, [profileId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error (GET /api/profile/:id):', err.stack);
    res.status(500).send('Server error');
  }
});

//Fetch multiple profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.profile_id,
        p.name,
        p.reputation_points,
        array_to_json(p.languages) AS languages,
        array_agg(s.skill) AS skills
      FROM skill_profile p
      LEFT JOIN skill_listing s ON p.profile_id = s.profile_id
      GROUP BY p.profile_id
      LIMIT 4;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching profiles:', err);
    res.status(500).send('Server error');
  }
});


//search profiles name or skill
app.get('/api/search', async (req, res) => {
  const { query } = req.query;

  try {
    const result = await pool.query(`
      SELECT 
        p.profile_id,
        p.name,
        p.reputation_points,
        array_to_json(p.languages) AS languages,
        array_agg(s.skill) AS skills
      FROM skill_profile p
      LEFT JOIN skill_listing s ON p.profile_id = s.profile_id
      WHERE p.name ILIKE $1 OR s.skill ILIKE $1
      GROUP BY p.profile_id
    `, [`%${query}%`]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error searching profiles:', err);
    res.status(500).send('Server error');
  }
});


// -------------------- Server Start --------------------
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
