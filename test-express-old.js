import express from 'express';
const app = express();
const router = express.Router();

router.get('/sitemap.xml', (req, res) => {
  res.send('XML CONTENT FROM OLD SETUP');
});

app.use('/api', router);

app.listen(3006, () => {
  console.log('Listening');
});
