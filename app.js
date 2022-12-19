/* eslint-disable no-unused-vars */
const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");

// const todo = require("./models/todo")
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
//app.Method(Path,Handler)
//or
//app.Method(path,callback[,callback....])
app.set("view engine", "ejs");

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "my-super-secret-key-21728173615375893",
    resave :false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000

    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username, password: password } })
        .then((user) => {
          return done(null, user);
        })
        .catch((error) => {
          return error;
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

const { Todo, User } = require("./models");

app.get("/", async (request, response) => {
  // console.log(request.user)
    response.render("index", {
      title: "Todo app",
      csrfToken: request.csrfToken(),
    });
});

app.get("/todos",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log(request.user)
  const allTodos = await Todo.getTodos();
  const overdue = await Todo.overdue();
  const dueToday = await Todo.dueToday();
  const dueLater = await Todo.dueLater();
  const completedItems = await Todo.completedItems();
  if (request.accepts("html")) {
    response.render("todo", {
      title: "Todo app",
      overdue,
      dueToday,
      dueLater,
      completedItems,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      overdue,
      dueToday,
      dueLater,
      completedItems,
    });
  }
});

app.get("/signup", (request, response) =>{
  response.render("signup",{title:"Signup",csrfToken: request.csrfToken() })
})

app.post("/users",async (request,response)=>{
  console.log("Firstname",request.body.firstName)
  //creating user
  try{
    const user = await User.create({
      firstName:request.body.firstName,
      lastName: request.lastName,
      email: request.email,
      password: request.password,
    })
    request.login(user,(err) =>{
      if (err){
        console.log(err)
      }
      response.redirect("/todos")
    })  
  }catch(error){
    console.log(error)
  }
})
app.get("/todos", (request, response) => {
  //response.send("hello ")
  console.log("Todo list", request.body);
});

app.post("/todos", async (request, response) => {
  console.log("creating a todo", request.body);
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false,
    });
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

//put http://mytodoapp.com/todos/123/markAsCopleted
app.put("/todos/:id", async (request, response) => {
  console.log("need to update todo with ID:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async (request, response) => {
  console.log("delete todo by id:", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    return response.status(422).json(error);
  }
});
module.exports = app;
