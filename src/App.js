import React, { useState, useEffect } from 'react';
import TodoList from './components/TodoList';
import UrlBlockList from './components/UrlBlockList';
import './styles.css';

function App() {
  return (
    <div className="app">
      <div className="container">
        <h1>Focused Todo</h1>
        <TodoList />
        <UrlBlockList />
      </div>
    </div>
  );
}

export default App;

