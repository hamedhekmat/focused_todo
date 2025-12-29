import React, { useState, useEffect } from 'react';

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [repeatsDaily, setRepeatsDaily] = useState(false);

  // Load todos from storage on mount
  useEffect(() => {
    loadTodos();
    checkDailyReset();
    
    // Set up interval to check for midnight reset
    const interval = setInterval(() => {
      checkDailyReset();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Save todos to storage whenever they change
  useEffect(() => {
    saveTodos();
  }, [todos]);

  const loadTodos = () => {
    chrome.storage.local.get(['todos'], (result) => {
      if (result.todos) {
        setTodos(result.todos);
      }
    });
  };

  const saveTodos = () => {
    chrome.storage.local.set({ todos });
  };

  const checkDailyReset = () => {
    const now = new Date();
    const today = now.toDateString();
    
    chrome.storage.local.get(['lastResetDate', 'todos'], (result) => {
      const lastResetDate = result.lastResetDate;
      const currentTodos = result.todos || [];
      
      // If it's a new day, reset daily repeating tasks
      if (lastResetDate !== today) {
        const updatedTodos = currentTodos.map(todo => {
          if (todo.repeatsDaily && todo.completed) {
            return { ...todo, completed: false };
          }
          return todo;
        });
        
        setTodos(updatedTodos);
        chrome.storage.local.set({ 
          todos: updatedTodos,
          lastResetDate: today 
        });
      }
    });
  };

  const addTask = () => {
    if (newTask.trim() === '') return;
    
    const newTodo = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
      repeatsDaily: repeatsDaily,
      createdAt: new Date().toISOString()
    };
    
    setTodos([...todos, newTodo]);
    setNewTask('');
    setRepeatsDaily(false);
  };

  const toggleComplete = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTask = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  // Sort todos: incomplete first, then completed
  const sortedTodos = [...todos].sort((a, b) => {
    // If one is completed and the other isn't, incomplete comes first
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    // If both have the same completion status, maintain original order (by id/creation time)
    return a.id - b.id;
  });

  return (
    <div className="todo-section">
      <h2>Todo List</h2>
      <div className="todo-input-container">
        <input
          type="text"
          className="todo-input"
          placeholder="Enter a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={repeatsDaily}
            onChange={(e) => setRepeatsDaily(e.target.checked)}
          />
          <span>Repeats Daily</span>
        </label>
        <button className="add-button" onClick={addTask}>
          Add Task
        </button>
      </div>
      <ul className="todo-list">
        {sortedTodos.map(todo => (
          <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <div className="todo-content">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleComplete(todo.id)}
                className="todo-checkbox"
              />
              <span className="todo-text">{todo.text}</span>
              {todo.repeatsDaily && (
                <span className="daily-badge" title="Repeats daily">🔄</span>
              )}
            </div>
            <button
              className="delete-button"
              onClick={() => deleteTask(todo.id)}
              title="Delete task"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      {todos.length === 0 && (
        <p className="empty-message">No tasks yet. Add one above!</p>
      )}
    </div>
  );
}

export default TodoList;

