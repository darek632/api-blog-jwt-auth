require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const passport = require("passport");
require("./config/passport");   


const authRouter = require("./routes/authRouter");
const backendRouter = require("./routes/backendRouter");

const app = express();

app.use(cors({
  origin: [
    "https://api-blog-jwt-auth-2.onrender.com",
    "https://api-blog-jwt-auth.onrender.com",
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://localhost:5174",
  ]
}));
app.use(express.json());
app.use(passport.initialize());


// app.use((req, res, next) => { req.user = { id: 1 }; next(); }); 
// for testing only, pretend every request is as 'user 1'
// before it gets to router

app.use(authRouter); 
app.use(backendRouter);

app.use((err, req, res, next) => {
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Not found" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});




// app.get('/', (req, res) => {
//   return res.send('Received a GET HTTP method');
// });

// app.post('/', (req, res) => {
//   return res.send('Received a POST HTTP method');
// });

// app.put('/', (req, res) => {
//   return res.send('Received a PUT HTTP method');
// });

// app.delete('/', (req, res) => {
//   return res.send('Received a DELETE HTTP method');
// });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`API listening on port ${PORT}`));