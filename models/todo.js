"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
      // define association here
    }
    static addTodo({ title, dueDate, userId }) {
      return this.create({
        title: title,
        dueDate: dueDate,
        completed: false,
        userId,
      });
    }
    static getTodos() {
      return this.findAll({ order: [["id", "ASC"]] });
    }
    markAsCompleted() {
      return this.update({ completed: true });
    }
    static overdue(userId) {
      return this.findAll({
        where: {
          dueDate: { [Op.lt]: new Date().toLocaleDateString("en-CA") },
          userId,
          completed: false,
        },
      });
    }
    static dueToday(userId) {
      return this.findAll({
        where: {
          dueDate: { [Op.eq]: new Date().toLocaleDateString("en-CA") },
          userId, //userId: userId
          completed: false,
        },
      });
    }
    static dueLater(userId) {
      return this.findAll({
        where: {
          dueDate: { [Op.gt]: new Date().toLocaleDateString("en-CA") },
          userId,
          completed: false,
        },
      });
    }
    static completedItems(userId) {
      return this.findAll({
        where: {
          userId,
          completed: true,
        },
      });
    }
    static remove(id, userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }
    deleteTodo() {
      return this.removetask(id);
    }
    // updateTodo(){
    // return this.update({completed:true})
    // }
    setCompletionStatus(bool) {
      return this.update({ completed: bool });
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
