// FROM TUTORIAL https://www.geeksforgeeks.org/how-to-use-typescript-on-backend/

// Importing module
import express from 'express';
  
const app = express();
const PORT:Number=3000;
  
// Handling GET / Request
app.get('/', (req, res) => {
    res.send('Welcome to typescript backend!');
})
  
// Server setup
app.listen(PORT,() => {
    console.log('The application is listening '
          + 'on port http://localhost:'+PORT);
})