import express from 'express';
const app = express();
app.get('/env', (req, res) => {
  res.json({
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    role: process.env.SUPABASE_SERVICE_ROLE_KEY
  });
});
app.listen(3001, () => console.log('listening'));
