const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
app.use(express.json());
const dbPath = require(__dirname, "userData.db");
let database = null;

const initialiseDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>{
      console.log("Server Running at http://localhost:3000/")
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initialiseDBAndServer();

const validPassword = (password) => {
  return password.length < 5;
};

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);
  if(databaseUser === undefined){
      const createUserQuery = `INSERT INTO user (username,name,password,gender,location) VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      if(validPassword(password)){
          await database.run(createUserQuery);
          response.send("User Created Successfully");
      }else{
          response.status(400);
          response.send("Password is too short");
      }
  }else{
      response.status(400);
      response.send("User already exists");
  }


app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      response.send("Login Success!");
    } else {
      response.send(400);
      response.send("Invalid Password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await database.get(selectUserQuery);

  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      if (validPassword(newPassword)) {
        const hashPassword = await bcrypt.hash(newPassword, 10);
        const updateQueryPassword = `UPDATE user SET password = '${hashedPassword}' WHERE username='${username}';`;
        const user = await database.run(updateQueryPassword);
        response.send("Password Updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
//Export the module
module.exports = app;
