import express, { type Request, type Response } from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.post('/api/webhook', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  
  // Basic security check (match the token in chainhook.json)
  if (authHeader !== 'Bearer secret-token') {
    console.warn('Unauthorized webhook attempt');
    res.status(401).send('Unauthorized');
    return;
  }

  console.log('Received Chainhook Event:', JSON.stringify(req.body, null, 2));

  // Process the event here
  // For now, we just acknowledge it
  res.status(200).send({ status: 'received' });
});

app.listen(port, () => {
  console.log(`Centrifuge app listening at http://localhost:${port}`);
  console.log('Ready to receive Chainhook events at /api/webhook');
});
