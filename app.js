const express = require("express");
const path = require("path");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "registration.db");
let db;

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DBError: ${e.message}`);
    process.exit(1);
  }
};

intializeDBAndServer();

//API 1

app.post("/register/", async (request, response) => {
  const { username, password, email } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const Query = `SELECT * FROM user WHERE username='${username}' ;`;
  const user = await db.get(Query);

  if (user === undefined) {
    const createUserQuery = `   
                                 INSERT INTO user(username,password,email)
                                 VALUES 
                                 ('${username}','${hashedPassword}',
                                 '${email}') ; `;
    await db.run(createUserQuery);
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    console.log(isPasswordMatched);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ message: "User logged in successfully", jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

//API 3

app.post("/forgotPassword/", async (request, response) => {
  const { email } = request.body;
  const Query = `SELECT * FROM user WHERE email='${email}' ;`;
  const user = await db.get(Query);

  if (db !== undefined) {
    const token = jwt.sign({ email }, "TOKEN");
    console.log(token);
    response.send({ message: "Password reset email sent" });
  } else {
    response.send("User Doesn't Exist ");
  }
});

//password update

app.post("/UpdatePassword/", async (request, response) => {
  const { email, password } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const Query = `SELECT * FROM user WHERE email='${email}' ;`;
  const user = await db.get(Query);

  const UpdatePassword = `UPDATE user 
                        SET password ='${hashedPassword}'
                        WHERE email='${email}'; `;
  await db.run(UpdatePassword);
  response.send("Password updated Successfully");
});
