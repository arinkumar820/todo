'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Database, 
  Inbox, 
  Sparkles,
  CheckCircle2,
  ListTodo
} from 'lucide-react';

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState('all');
  const [dbSource, setDbSource] = useState('mock-database');

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      if (data.todos) {
        setTodos(data.todos);
      }
      if (data.source) {
        setDbSource(data.source);
      }
    } catch (err) {
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, dueDate }),
      });
      if (res.ok) {
        const newTodo = await res.json();
        // Insert at the beginning of the list
        setTodos([newTodo, ...todos]);
        // Reset form inputs
        setTitle('');
        setCategory('general');
        setDueDate('');
      }
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  };

  const handleToggleTodo = async (todo) => {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTodos(todos.map(t => t.id === todo.id ? updated : t));
      }
    } catch (err) {
      console.error('Error toggling todo:', err);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTodos(todos.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  // Calculate statistics
  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Check if a task is overdue
  const isOverdue = (dateStr, completed) => {
    if (!dateStr || completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    return date < today;
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <main className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-title-wrapper">
          <ListTodo size={32} className="logo-glow" />
          <h1 className="app-title">AuraTodo</h1>
        </div>
        <p className="app-subtitle">Elevated task management with dynamic reactive states</p>
      </header>

      {/* Analytics Card */}
      <section className="glass-panel stats-card">
        <div className="stats-header">
          <h2 className="stats-title">Progress Overview</h2>
          <div className="stats-counter">
            <span>{completedCount}</span> of <span>{totalCount}</span> tasks completed
          </div>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>
      </section>

      {/* Todo Add Form */}
      <form onSubmit={handleAddTodo} className="glass-panel todo-form">
        <div className="input-row">
          <div className="input-container">
            <Sparkles className="input-icon" size={18} />
            <input
              type="text"
              placeholder="What needs to be accomplished today?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              required
            />
          </div>
        </div>
        <div className="meta-row">
          <div className="select-wrapper">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select-field"
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="design">Design</option>
              <option value="setup">Setup</option>
              <option value="deploy">Deployment</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="date-field"
            />
          </div>
          <button type="submit" className="btn-primary">
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </form>

      {/* Filter and Status Bar */}
      <div className="filters-bar">
        <div className="filter-tabs">
          <button
            onClick={() => setFilter('all')}
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          >
            Completed
          </button>
        </div>

        {/* Dynamic Database Indicator Badge */}
        <div className={`database-badge ${dbSource === 'mongodb' ? 'badge-mongo' : 'badge-mock'}`}>
          <span className="badge-pulse"></span>
          <Database size={12} />
          {dbSource === 'mongodb' ? 'MongoDB Connected' : 'Mock DB Mode'}
        </div>
      </div>

      {/* Todo List Items */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading tasks...
        </div>
      ) : filteredTodos.length > 0 ? (
        <div className="todo-list-wrapper">
          {filteredTodos.map((todo) => {
            const overdue = isOverdue(todo.dueDate, todo.completed);
            return (
              <article 
                key={todo.id} 
                className={`todo-item glass-panel ${todo.completed ? 'completed' : ''}`}
              >
                <div className="todo-item-left">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo)}
                    />
                    <span className="checkmark"></span>
                  </label>
                  
                  <div className="todo-content">
                    <span className="todo-title">{todo.title}</span>
                    <div className="todo-meta">
                      <span className={`todo-badge badge-${todo.category}`}>
                        {todo.category}
                      </span>
                      {todo.dueDate && (
                        <span className={`todo-date ${overdue ? 'overdue' : ''}`}>
                          <Calendar size={12} />
                          {overdue ? 'Overdue: ' : ''}{formatDate(todo.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="btn-delete"
                  aria-label="Delete task"
                  title="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel empty-state">
          <div className="empty-icon-wrapper">
            <Inbox size={28} />
          </div>
          <h3 className="empty-title">All tasks cleared</h3>
          <p className="empty-text">
            {filter === 'all' 
              ? 'Enjoy your free time, or create a brand new task above!' 
              : `No ${filter} tasks found.`}
          </p>
        </div>
      )}

      {/* Help Instructions Footer */}
      <footer className="app-footer">
        <p>
          Configure real database in <code>.env.local</code> to activate <code>MongoDB</code> connection.
        </p>
      </footer>
    </main>
  );
}
