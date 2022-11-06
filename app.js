/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json());
const path = require("path")
const { Todo } = require("./models");
//app.Method(Path,Handler)
//or
//app.Method(path,callback[,callback....])
app.set("view engine","ejs");



app.get("/",async (request,response) => {
  const allTodos = await Todo.getTodos()
  if(request.accepts("html")){
    response.render('index',{
      allTodos
    })
  }else{
    response.json({
      allTodos
    })
  }
});
app.use(express.static(path.join(__dirname,'public')))
app.get("/todos", (request, response) => {
  //response.send("hello ")
  console.log("Todo list",request.body);
});

app.post("/todos", async (request, response) => {
  console.log("creating a todo", request.body);
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false,
    });
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

//put http://mytodoapp.com/todos/123/markAsCopleted
app.put("/todos/:id/markAsCompleted", async (request, response) => {
  console.log("need to updat todo with ID:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
app.delete("/todos/:id", (request, response) => {
  console.log("delete todo by id:", request.params.id);
});
module.exports = app;
