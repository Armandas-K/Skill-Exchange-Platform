const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { Pool } = require('pg');
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
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Failed to connect to database:', err);
  } else {
    console.log('Successfully connected to database at:', res.rows[0].now);
  }
});

//Helpers
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

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

    await pool.query(`
      SELECT create_account($1, $2, $3, $4, $5)
    `, [
      email,
      password,
      req.body.name || 'Unnamed',
      req.body.location || 'Unknown',
      language
    ]);

    res.json({ message: 'Registration successful' });

  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).send('Server error');
  }
});


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT login_user($1, $2) AS account_id',
      [email, password]
    );

    const userId = result.rows[0]?.account_id;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = userId;

    res.json({ message: 'Login successful', userId });

  } catch (err) {
    if (err.message.includes('Invalid email or password')) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.error('Database error during login:', err.message);
    res.status(500).json({ error: 'Server error' });
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
app.get('/api/profile/:id', requireLogin, async (req, res) => {
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

//Fetch specific profile
app.get('/api/profile', requireLogin, async (req, res) => {
  const userId = req.session.userId;

  try {
    const profileResult = await pool.query(`
      SELECT profile_id, name, reputation_points, languages
      FROM skill_profile
      WHERE account_id = $1
    `, [userId]);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = profileResult.rows[0];

    const skillsResult = await pool.query(`
      SELECT skill_id, skill
      FROM skill_listing
      WHERE profile_id = $1
    `, [profile.profile_id]);

    res.json({
      ...profile,
      skills: skillsResult.rows
    });

  } catch (err) {
    console.error('Database error (GET /api/profile):', err.stack);
    res.status(500).send('Server error');
  }
});

//PUT profile
app.put('/api/profile', requireLogin, async (req, res) => {
  const userId = req.session.userId;
  const { name, skills, languages } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const profileResult = await pool.query('SELECT profile_id FROM skill_profile WHERE account_id = $1', [userId]);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profileId = profileResult.rows[0].profile_id;

    await pool.query(`
      UPDATE skill_profile
      SET name = $1, languages = $2
      WHERE profile_id = $3
    `, [name, languages, profileId]);

    //remove old skills, insert new ones
    await pool.query('DELETE FROM skill_listing WHERE profile_id = $1', [profileId]);

    for (const skill of skills) {
      await pool.query(`
        INSERT INTO skill_listing (profile_id, skill, description, languages, tags)
        VALUES ($1, $2, '', ARRAY['English']::language[], ARRAY[]::tag[])
      `, [profileId, skill]);
    }

    res.json({ message: 'Profile updated successfully' });

  } catch (err) {
    console.error('Database error (PUT /api/profile):', err.stack);
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

//get skills
app.get('/api/profile/skills/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT skill_id, skill FROM skill_listing WHERE profile_id = $1',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching profile skills:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

//Exchange
app.post('/api/exchange', async (req, res) => {
  const {
    profile_id_1,
    profile_id_2,
    skill_id_1,
    skill_id_2,
    location
  } = req.body;

  const now = new Date();

  try {
    const result = await pool.query(`
      INSERT INTO exchange (
        profile_id_1,
        profile_id_2,
        skill_id_1,
        skill_id_2,
        status,
        location,
        date_start,
        date_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      profile_id_1,
      profile_id_2,
      skill_id_1,
      skill_id_2,
      'Requested',
      location,
      now,
      now
    ]);

    res.json({ message: 'Exchange request created successfully' });

  } catch (err) {
    console.error('Error creating exchange:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/exchange/request', async (req, res) => {
  const accountId = req.session.userId;
  const { to_profile_id, skill_id_1, skill_id_2 } = req.body;

  if (!accountId || !to_profile_id || !skill_id_1 || !skill_id_2) {
    return res.status(400).json({ error: 'Missing required fields (user, profile, or skills)' });
  }

  try {
    const result = await pool.query(
      'SELECT profile_id FROM skill_profile WHERE account_id = $1',
      [accountId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'You must create your profile first.' });
    }

    const senderProfileId = result.rows[0].profile_id;

    const profileData = await pool.query(
      'SELECT location FROM skill_profile WHERE profile_id = $1',
      [to_profile_id]
    );
    const location = profileData.rows[0]?.location || 'Online';

    console.log("Sender profile ID:", senderProfileId, "| Target profile ID:", to_profile_id, "| Location:", location);

    const now = new Date();
    await pool.query(`
      INSERT INTO exchange (
        profile_id_1,
        profile_id_2,
        skill_id_1,
        skill_id_2,
        status,
        location,
        date_start,
        date_end
      ) VALUES ($1, $2, $3, $4, 'Requested', $5, $6, $7)
    `, [senderProfileId, to_profile_id, skill_id_1, skill_id_2, location, now, now]);

    res.json({ message: 'Exchange request submitted successfully.' });

  } catch (err) {
    console.error('Error creating exchange:', err);
    res.status(500).json({ error: 'Server error' });
  }
});




app.get('/api/exchange/received', requireLogin, async (req, res) => {
  const userId = req.session.userId;

  try {
    const profileResult = await pool.query(
      'SELECT profile_id FROM skill_profile WHERE account_id = $1',
      [userId]
    );
    const profileId = profileResult.rows[0]?.profile_id;

    const result = await pool.query(`
      SELECT e.*, s1.skill AS offered_skill, s2.skill AS requested_skill
      FROM exchange e
      LEFT JOIN skill_listing s1 ON e.skill_id_1 = s1.skill_id
      LEFT JOIN skill_listing s2 ON e.skill_id_2 = s2.skill_id
      WHERE e.profile_id_2 = $1 AND e.status = 'Requested'
    `, [profileId]);

    res.json(result.rows);

  } catch (err) {
    console.error('Error fetching received exchanges:', err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});


// -------------------- Server Start --------------------
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
