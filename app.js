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
const bcrypt = require("bcrypt");

const saltRounds = 10;
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
      User.findOne({ where: { email: username } })
        .then(async(user) => {
          const result = await bcrypt.compare(password,user.password)
          if (result){
            return done(null, user);
          }else {
            return done("Invalid Password")
          }
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
// const { next } = require("cheerio/lib/api/traversing");

app.get("/", async (request, response) => {
  // console.log(request.user)
    response.render("index", {
      title: "Todo app",
      csrfToken: request.csrfToken(),
    });
});

app.get("/todos",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log(request.user)
  const loggedInUser = request.user.id;
  const allTodos = await Todo.getTodos(loggedInUser);
  const overdue = await Todo.overdue(loggedInUser);
  const dueToday = await Todo.dueToday(loggedInUser);
  const dueLater = await Todo.dueLater(loggedInUser);
  const completedItems = await Todo.completedItems(loggedInUser);
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
  const hashedPad = await bcrypt.hash(request.body.password,saltRounds)
  console.log(hashedPad)
  //creating user
  try{
    const user = await User.create({
      firstName:request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPad,
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

app.get("/login",(request,response) => {
  response.render("login",{title:"Login",csrfToken: request.csrfToken()});
})

app.post("/session",passport.authenticate('local',{failureRedirect: "/login"}),(request,response)=>{
  console.log(request.user);
  response.redirect("/todos");
})

app.get("/signout", (request,response) => {
  request.logout((err) => {
    // eslint-disable-next-line no-undef
    if (err) { return next(err); }
    response.redirect("/")
  })
})

app.get("/todos", (request, response) => {
  console.log("Todo list", request.body);
});

app.post("/todos",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("creating a todo", request.body);
  console.log(request.user)
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false,
      userId: request.user.id,
    });
    return response.redirect("/todos");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

//put http://mytodoapp.com/todos/123/markAsCopleted
app.put("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
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

app.delete("/todos/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("delete todo by id:", request.params.id);
  try {
    await Todo.remove(request.params.id,request.user.id);
    return response.json({ success: true });
  } catch (error) {
    return response.status(422).json(error);
  }
});
module.exports = app;
