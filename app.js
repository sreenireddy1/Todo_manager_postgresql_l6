const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("This is a secret string!!!"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

const { Todo } = require("./models");

app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  const allTodosAre = await Todo.getAllTodos();
  const completedItems = await Todo.completedItems();
  const overdue = await Todo.overdue();
  const dueLater = await Todo.dueLater();
  const dueToday = await Todo.dueToday();
  if (request.accepts("html")) {
    response.render("index", {
      title: "My Todo Manager",
      allTodosAre,
      overdue,
      dueLater,
      dueToday,
      completedItems,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({ overdue, dueLater, dueToday, completedItems });
  }
});

app.post("/todos", async (request, response) => {
  console.log("creating new todo", request.body);
  try {
    await Todo.addaTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false,
    });

    return response.redirect("/");
  } catch (err1) {
    console.log(err1);
    return response.status(422).json(err1);
  }
});

app.put("/todos/:id", async (request, response) => {
  console.log("Marking a todo as completed : ", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedtodo = await todo.setCompletionStatusAs(
      request.body.completed
    );
    return response.json(updatedtodo);
  } catch (err2) {
    console.log(err2);
    return response.status(422).json(err2);
  }
});
app.delete("/todos/:id", async (request, response) => {
  console.log("Deleting a todo with a particular id..", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({ success: true });
  } catch (err3) {
    return response.status(422).json(err3);
  }
});
module.exports = app;
