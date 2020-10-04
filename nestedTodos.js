'use strict';

var ENTER_KEY = 13;
var ESCAPE_KEY = 27;
var TAB_KEY = 9;
var DOWN_ARROW_KEY = 40;

// Create Todo object using a constructor.
function Todo(todoText) {
  this.id = util.uuid();
  this.todoText = todoText;
  this.completed = false;
  this.todos = [];
}

// Util Object:
  // uuid: Returns a unique identifier per each todo.
  // store: Sets and gets App.todos from localStorage.
  // findTodoById: Returns a reference object for a todo with a given ID.

var util = {
  uuid: function () {
    var i, random;
    var uuid = '';

    for (i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += '-';
      }
      uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
    }

    return uuid;
  },

  store: function (namespace, data) {
    if (arguments.length > 1) {
      return localStorage.setItem(namespace, JSON.stringify(data));
    } else {
      var store = localStorage.getItem(namespace);
      return (store && JSON.parse(store)) || [];
    }
  }, 

  findTodoById: function(list, id) {
    if (list.length) {
      for (var i = 0; i < list.length; i++) {
        var foundTodo = util.findTodoById(list[i].todos, id);
        
        if (list[i].id === id) {
          return {
            todo: list[i],
            position: i,
            list: list
          };
        }

        if (foundTodo) {
          return foundTodo;
        }
      }
    }
  }
};

// App Object:
  // init: Retrieves stored data, binds events, and renders the UI.
  // bindEvents: Binds event listeners to UI elements.
  // addTodo: Pushes a todo to a given list.
  // changeTodo: modifies todo text at a given position on a given list.
  // deleteTodo: deletes a todo at a given position on a given list.
  // deleteCompletedTodos: Runs App.deleteTodos on any completed todos.
  // toggleCompleted: Toggles .completed property on a todo at a given position on a given list.

var App = {
  init: function () {
    this.todos = util.store('todos-js');
    this.bindEvents();
    view.displayTodos();
    document.getElementById('todoInput').focus();    
  },
  bindEvents: function () {
    document.getElementById('deleteCompletedTodosButton').addEventListener('click', function() {
      App.deleteCompletedTodos();
    });
    document.getElementById('todoListUl').addEventListener('click', function(e) {
      if (e.target.className === 'deleteButton') {
        handlers.deleteTodoHandler(e);
      } else if (e.target.className === 'edit') {
        view.moveInput(e);
      } else if (e.target.className === 'collapseListButton') {
        view.collapseList(e);
      }
    });
    document.getElementById('todoListUl').addEventListener('change', function(e) {
      if (e.target.className === 'toggleCheckbox') {
        handlers.toggleCompletedHandler(e);
        view.moveInput(e);
      }
    });
    document.getElementById('todoListUl').addEventListener('keydown', function(e) {
      if (e.which === ENTER_KEY && e.target.id === 'todoInput') {
        handlers.addTodoHandler(e);
      } else if (e.which === ENTER_KEY && e.target.className === 'edit') {
        handlers.changeTodoHandler(e);
      } else if (e.which === ESCAPE_KEY) {
        handlers.updateTodoHandler(e);
      } else if (e.which === TAB_KEY && e.target.id === 'todoInput') {
        view.addSubTodoField(e);
      } else if (e.which === TAB_KEY && e.target.id !== 'todoInput') {
        if (view.collapsedUlIds.includes(e.target.closest('li').id)) {
          view.collapseList(e);
        } else {
          view.addSubTodoField(e);
        }
      } else if (e.which === DOWN_ARROW_KEY && e.target.className === 'edit') {
        document.getElementById('todoInput').focus();
      }
    });
  },

  addTodo: function(list, todoText) {
    list.push(new Todo(todoText))
  },

  changeTodo: function(list, position, todoText) {
    list[position].todoText = todoText;
  },

  deleteTodo: function(list, position) {
    list.splice(position, 1);
  },

  deleteCompletedTodos: function() {
    var todoReference;
    var completedTodos = Array.prototype.slice.call(document.querySelectorAll('input:checked'));
    var completedTodoLis = completedTodos.map(function(todo) {
      return todo.parentElement;
    });

    for (var i = 0; i < completedTodoLis.length; i++) {
      if (document.getElementById(completedTodoLis[i].id)) {
        todoReference = util.findTodoById(App.todos, completedTodoLis[i].id);
        completedTodoLis[i].parentNode.removeChild(completedTodoLis[i]);
        App.deleteTodo(todoReference.list, todoReference.position);
      }
    }
    view.displayTodos();
  },

  toggleCompleted: function(list, position) {
    list[position].completed = !list[position].completed;
  }
};

// Handlers Object:
  // addTodoHandler: Runs App.addTodo with arguments passed from DOM.
  // changeTodoHandler: Runs App.changeTodo with arguments passed from DOM.
  // deleteTodoHandler: Runs App.deleteTodo with arguments passed from DOM.
  // toggleCompletedHandler: Runs toggleCompleted with arguments passed from DOM.
  // updateTodoHandler: Cancels edits on todo inputs with values, or deletes todos that have their inputs cleared.
  // getIndexFromEl: Runs util.findTodoById with arguments passed from DOM.

var handlers = {
  addTodoHandler: function(e) {
    var todoText = e.target.value.trim();

    if (todoText && e.target.closest('ul').id === 'todoListUl') {
      App.addTodo(App.todos, todoText);
    } else if (todoText) {
      var todoReference = this.getIndexFromEl(e);
      App.addTodo(todoReference.todo.todos, todoText);
    } else if (!todoText) {
      return;
    }

    view.displayTodos();
  },
  changeTodoHandler: function(e) {
    var todoReference = this.getIndexFromEl(e);
    var todoText = e.target.value.trim();

    App.changeTodo(todoReference.list, todoReference.position, todoText);
    view.displayTodos();
  },
  deleteTodoHandler: function(e) {
    var todoReference = this.getIndexFromEl(e);

    App.deleteTodo(todoReference.list, todoReference.position);
    view.displayTodos();
  },
  toggleCompletedHandler: function(e) {
    var todoReference = this.getIndexFromEl(e);

    App.toggleCompleted(todoReference.list, todoReference.position);
    view.displayTodos();
  },
  updateTodoHandler: function(e) {
    if (e.target.value) {
      e.target.blur();
      view.displayTodos();
    } else {
      this.deleteTodoHandler(e);
    }
  },
  getIndexFromEl: function(e) {
    if (document.getElementsByClassName('todo')[0]) {
      var id = e.target.closest('.todo').id;
    }
    var todoReference = util.findTodoById(App.todos, id);

    if (todoReference) {
      return todoReference;
    }
  }
};

// View Object:
  // displayTodos: renders the nested todo list in the DOM; runs methods that create interactive UI elements.
  // collapseList: hides/shows a list when a collapse/expand button is clicked.
  // createToggleCheckbox: creates the checkbox that toggles the completed property of a todo.
  // createCheckboxLabel: creates the label on the checkbox with the todo name and the completed property status.
  // createDeleteButton: creates button on a todo that will delete that todo when clicked.
  // createCollapseListButton: creates button on a todo that will hide/show that todo's sub-list(s), if any.
  // createInputField: creates an input field for adding todos on a given list.
  // addSubTodoField: creates an input field on a new unordered list, for adding sub-lists to existing elements.
  // moveInput: moves the main input field to the bottom of any clicked list. 

var view = {
  displayTodos: function() {
    util.store('todos-js', App.todos);
    var todosUl = document.querySelector('ul');
    this.collapsedUls = Array.prototype.slice.call(document.querySelectorAll('ul [hidden'));
    this.collapsedUlIds = this.collapsedUls.map(function(e) {
      return e.className;
    });

    if (document.activeElement.type === 'text') {
      var activeElement = document.activeElement;
      var closestUlClass = activeElement.closest('ul').className;
      var closestUl;
    }
    todosUl.innerHTML = '';

    for (var i = 0; i < App.todos.length; i++) {
      todosUl.appendChild(listBuilder(App.todos[i], i));
    }

    if (document.querySelectorAll('input:checked').length) {
      document.getElementById('deleteCompletedTodosButton').hidden = false;
    } else {
      document.getElementById('deleteCompletedTodosButton').hidden = true;
    }

    if (activeElement && closestUlClass) {
      closestUl = document.getElementsByClassName(closestUlClass)[0];
      closestUl.appendChild(this.createInputField());
    } else {
      document.getElementById('todoListUl').appendChild(this.createInputField());
    }

    document.getElementById('todoInput').focus();

    function listBuilder(todo) {
      var todoLi = document.createElement('li');
      todoLi.className = 'todo';
      todoLi.id = todo.id;

      todoLi.appendChild(view.createToggleCheckbox(todo.todoText, todo.completed, todoLi.id));
      todoLi.appendChild(view.createCheckboxLabel(todo.todoText, todo.completed));
      
      if (todo.todos.length) {
        todoLi.appendChild(view.createCollapseListButton(todoLi.id));
      }

      todoLi.appendChild(view.createDeleteButton());

      if (todo.todos.length === 0) {
        return todoLi;
      } else {
        var subUl = document.createElement('ul');
        subUl.className = todoLi.id;

        if (view.collapsedUlIds.includes(subUl.className)) {
          subUl.hidden = true;
        }

        for (var i = 0; i < todo.todos.length; i++) {
          subUl.appendChild(listBuilder(todo.todos[i]));
        }
        todoLi.appendChild(subUl);

        return todoLi;
      }
    }
  },
  collapseList: function(e) {
    e.preventDefault();
    var childUl = e.target.closest('li').querySelector('ul');
    var collapseListButton = e.target.closest('.collapseListButton');

    if (childUl && childUl.hidden && collapseListButton) {
      childUl.hidden = false;
      e.target.closest('li').querySelector('.collapseListButton').textContent = 'Collapse';
    } else if (childUl && collapseListButton) {
      childUl.hidden = true;
      e.target.closest('li').querySelector('.collapseListButton').textContent = 'Expand';
    }
  },
  createToggleCheckbox: function(value, completed, id) {
    var toggleCheckbox = document.createElement('input');
    toggleCheckbox.type = 'checkbox';
    toggleCheckbox.value = value;
    toggleCheckbox.className = 'toggleCheckbox';

    if (completed) {
      toggleCheckbox.checked = true;
    }

    return toggleCheckbox;
  },
  createCheckboxLabel: function(value, completed) {
    var checkboxLabel = document.createElement('label');
    var labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = value;
    labelInput.className = 'edit';
    labelInput.contentEditable = true;

    if (completed) {
      labelInput.style.textDecoration = 'line-through';
    }

    checkboxLabel.appendChild(labelInput);

    return checkboxLabel;
  },
  createDeleteButton: function() {
    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'deleteButton';
    return deleteButton;
  },
  createCollapseListButton: function(id) {
    var collapseListButton = document.createElement('button');

    if (this.collapsedUlIds.includes(id)) {
      collapseListButton.textContent = 'Expand';
    } else {
      collapseListButton.textContent = 'Collapse';
    }

    collapseListButton.className = 'collapseListButton';
    return collapseListButton;
  },
  createInputField: function(inputClass) {
    var inputElement = document.createElement('input');
    var inputLi = document.createElement('li');

    if (inputClass) {
      inputElement.className = inputClass;
    }

    inputLi.id = 'inputFieldLi';
    inputElement.type = 'text';
    inputElement.placeholder = "What needs to be done?";
    inputElement.id = 'todoInput';
    inputLi.appendChild(inputElement);
    return inputLi;
  },
  addSubTodoField: function(e) {
    var textContent = e.target.value.trim();
    var todoInputLi = document.getElementById('inputFieldLi');
    var newListUl = document.createElement('ul');
    var subInputField = view.createInputField('subTodoInput');
    var previousSibling = e.target.closest('li').previousSibling;

    if (e.target.value && e.target.className === 'edit') {
      newListUl.className = e.target.closest('.todo').id;
      subInputField.className = 'subTodoInput';

      e.preventDefault();
      todoInputLi.remove();

      newListUl.appendChild(subInputField);
      e.target.closest('li').appendChild(newListUl);
    } else if (previousSibling && previousSibling.querySelector('ul') === null) {
      newListUl.className = e.target.closest('li').previousSibling.id;

      e.preventDefault();
      todoInputLi.remove();

      newListUl.appendChild(subInputField);
      previousSibling.appendChild(newListUl);
    } else if (previousSibling) {
      e.preventDefault();
      todoInputLi.remove();

      previousSibling.querySelector('ul').appendChild(subInputField);
    }

    if (e.target.className !== 'edit') {
      document.getElementById('todoInput').value = textContent;
    }

    document.getElementById('todoInput').focus();
  },
  moveInput: function(e) {
    var eventId = e.target.closest('.todo').id;
    var closestLi = document.getElementById(eventId);
    var inputFieldLi = document.getElementById('inputFieldLi');

    if (closestLi.parentElement.lastChild !== inputFieldLi) {
      inputFieldLi.remove();
      closestLi.parentElement.appendChild(view.createInputField('subTodoInput'));
    }
    if (document.activeElement.className !== 'edit') {
      document.getElementById('todoInput').focus();
    }
  }
};

App.init();