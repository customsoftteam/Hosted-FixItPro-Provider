const express = require('express');
const cors = require('cors');
require('dotenv').config();
const apiRoutes = require('./src/routes');

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true); // allow all origins
    },
  })
)

// Middleware
// app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Something went wrong!',
  });
});

module.exports = app;
