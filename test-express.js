import express from 'express';
const app = express();
const router = express.Router();

router.get('/sitemap.xml', (req, res) => {
  res.send('XML CONTENT');
});

app.get('/sitemap.xml', router);

app.listen(3005, () => {
  console.log('Listening');
});
