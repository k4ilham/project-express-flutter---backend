const express = require('express')
const app = express()
const port = 3000

//import library CORS
const cors = require('cors')

//config
require('dotenv').config();

//jwt
const jwt = require('jsonwebtoken');


//use cors
app.use(cors())

//import body parser
const bodyParser = require('body-parser')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

function authenticateJWT(req, res, next) {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (token) {
      jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
          if (err) {
              return res.status(403).json({ message: 'Invalid token' });
          }
          req.user = user;
          next();
      });
  } else {
      res.status(401).json({ message: 'Token required' });
  }
}

// Import route auth
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);


// Import route categories
const categoriesRouter = require('./routes/categories');
// app.use('/api/categories', categoriesRouter); 
app.use('/api/categories', authenticateJWT, categoriesRouter);


app.listen(port, () => {
  console.log(`app running at http://localhost:${port}`)
})