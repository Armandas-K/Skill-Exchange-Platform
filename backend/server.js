const express = require('express');
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
