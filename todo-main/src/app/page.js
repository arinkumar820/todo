'use client';

// CHANGED: Connected frontend dashboard to live MongoDB aggregation analytics APIs (/api/todos/analytics).
// Handled model key mappings correctly (supporting both _id and id representation).
// Added a LocalStorage fallback system: if the backend database connection fails or is offline,
// the client switches to Local Storage, calculates identical progress and category stats locally,
// and runs all operations (add, toggle, delete) client-side without page crashes.
// Styled grid stats blocks, category lists, validation error toasts, and database status badges.

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Database, 
  Inbox, 
  Sparkles,
  CheckCircle2,
  ListTodo,
  AlertCircle
} from 'lucide-react';

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState('all');
  const [dbSource, setDbSource] = useState('mock-database');
  const [errorMsg, setErrorMsg] = useState('');
  const [analytics, setAnalytics] = useState({
    stats: { totalCount: 0, completedCount: 0, pendingCount: 0, percentage: 0 },
    categoryStats: [],
    overdueCount: 0
  });

  // Check if a task is overdue
  const isOverdue = (dateStr, completed) => {
    if (!dateStr || completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    return date < today;
  };

  // Local analytics calculator for fallback mode
  const calculateLocalAnalytics = (allTodos) => {
    const totalCount = allTodos.length;
    const completedCount = allTodos.filter(t => t.completed).length;
    const pendingCount = totalCount - completedCount;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Group by category
    const catGroups = {};
    allTodos.forEach(todo => {
      const cat = todo.category || 'general';
      if (!catGroups[cat]) {
        catGroups[cat] = { category: cat, totalCount: 0, completedCount: 0 };
      }
      catGroups[cat].totalCount++;
      if (todo.completed) {
        catGroups[cat].completedCount++;
      }
    });

    const categoryStats = Object.values(catGroups).sort((a, b) => b.totalCount - a.totalCount);
    const overdueCount = allTodos.filter(t => isOverdue(t.dueDate, t.completed)).length;

    setAnalytics({
      stats: { totalCount, completedCount, pendingCount, percentage },
      categoryStats,
      overdueCount
    });
  };

  // Fetch todos and analytics on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Attempt to fetch from backend API
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('API server returned error status');
      const data = await res.json();
      
      if (data.todos) {
        setTodos(data.todos);
      }
      if (data.source) {
        setDbSource(data.source);
      }
      
      // Load backend analytics
      await fetchAnalytics();
    } catch (err) {
      console.warn('Backend API connection failed, using LocalStorage fallback:', err);
      setDbSource('localstorage-fallback');
      
      const local = localStorage.getItem('auratodo_todos');
      if (local) {
        const parsedTodos = JSON.parse(local);
        setTodos(parsedTodos);
        calculateLocalAnalytics(parsedTodos);
      } else {
        const defaultTodos = [
          { id: '1', title: 'Learn MongoDB Aggregation', category: 'setup', completed: false, dueDate: new Date().toISOString().split('T')[0] },
          { id: '2', title: 'Fix Backend validation errors', category: 'work', completed: true, dueDate: '' },
          { id: '3', title: 'Build a premium responsive UI', category: 'design', completed: true, dueDate: '' }
        ];
        setTodos(defaultTodos);
        localStorage.setItem('auratodo_todos', JSON.stringify(defaultTodos));
        calculateLocalAnalytics(defaultTodos);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      if (data.todos) {
        setTodos(data.todos);
      }
    } catch (err) {
      console.error('Error fetching todos:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/todos/analytics');
      const data = await res.json();
      if (data.success) {
        setAnalytics({
          stats: data.stats,
          categoryStats: data.categoryStats,
          overdueCount: data.overdueCount
        });
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setErrorMsg('');

    if (dbSource === 'localstorage-fallback') {
      if (title.trim().length < 3) {
        setErrorMsg('Title must be at least 3 characters long');
        return;
      }
      const newTodo = {
        id: Date.now().toString(),
        title: title.trim(),
        category,
        dueDate,
        completed: false,
        createdAt: new Date().toISOString()
      };
      const updatedTodos = [newTodo, ...todos];
      setTodos(updatedTodos);
      localStorage.setItem('auratodo_todos', JSON.stringify(updatedTodos));
      setTitle('');
      setCategory('general');
      setDueDate('');
      calculateLocalAnalytics(updatedTodos);
      return;
    }

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, dueDate }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setTodos([data, ...todos]);
        setTitle('');
        setCategory('general');
        setDueDate('');
        fetchAnalytics();
      } else {
        setErrorMsg(data.error || 'Failed to add todo');
      }
    } catch (err) {
      console.error('Error adding todo:', err);
      setErrorMsg('Network error. Failed to add todo.');
    }
  };

  const handleToggleTodo = async (todo) => {
    const todoId = todo.id || todo._id;
    
    if (dbSource === 'localstorage-fallback') {
      const updatedTodos = todos.map(t => {
        const id = t.id || t._id;
        return id === todoId ? { ...t, completed: !t.completed } : t;
      });
      setTodos(updatedTodos);
      localStorage.setItem('auratodo_todos', JSON.stringify(updatedTodos));
      calculateLocalAnalytics(updatedTodos);
      return;
    }

    try {
      const res = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTodos(todos.map(t => (t.id === todoId || t._id === todoId) ? updated : t));
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Error toggling todo:', err);
    }
  };

  const handleDeleteTodo = async (todo) => {
    const todoId = todo.id || todo._id;

    if (dbSource === 'localstorage-fallback') {
      const updatedTodos = todos.filter(t => {
        const id = t.id || t._id;
        return id !== todoId;
      });
      setTodos(updatedTodos);
      localStorage.setItem('auratodo_todos', JSON.stringify(updatedTodos));
      calculateLocalAnalytics(updatedTodos);
      return;
    }

    try {
      const res = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTodos(todos.filter(t => t.id !== todoId && t._id !== todoId));
        fetchAnalytics();
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
            <span>{analytics.stats.completedCount}</span> of <span>{analytics.stats.totalCount}</span> tasks completed
          </div>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${analytics.stats.percentage}%` }}
          ></div>
        </div>

        {/* MongoDB Aggregation Analytics Grid */}
        <div className="analytics-grid">
          <div className="analytics-mini-card">
            <div className="mini-card-val color-primary">{analytics.stats.percentage}%</div>
            <div className="mini-card-lbl">Completed</div>
          </div>
          <div className="analytics-mini-card">
            <div className="mini-card-val color-secondary">{analytics.stats.pendingCount}</div>
            <div className="mini-card-lbl">Pending</div>
          </div>
          <div className="analytics-mini-card">
            <div className={`mini-card-val ${analytics.overdueCount > 0 ? 'color-danger' : 'color-success'}`}>
              {analytics.overdueCount}
            </div>
            <div className="mini-card-lbl">Overdue</div>
          </div>
        </div>

        {/* Category breakdown (aggregation results) */}
        {analytics.categoryStats && analytics.categoryStats.length > 0 && (
          <div>
            <h3 className="category-stats-title">Category Breakdown</h3>
            <div className="category-stats-grid">
              {analytics.categoryStats.map((catStat) => (
                <div key={catStat.category} className="category-stat-item">
                  <div className="cat-info">
                    <span className={`cat-dot cat-dot-${catStat.category}`}></span>
                    <span className="cat-name">{catStat.category}</span>
                  </div>
                  <div className="cat-nums">
                    <span>{catStat.completedCount}</span>/{catStat.totalCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
        
        {/* Error message UI */}
        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '0.85rem', marginTop: '8px' }}>
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}
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
        <div className={`database-badge ${
          dbSource === 'mongodb' 
            ? 'badge-mongo' 
            : 'badge-mock'
        }`}>
          <span className="badge-pulse"></span>
          <Database size={12} />
          {dbSource === 'mongodb' ? 'MongoDB Connected' : 'Local Storage Fallback'}
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
            const todoId = todo.id || todo._id;
            return (
              <article 
                key={todoId} 
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
                  onClick={() => handleDeleteTodo(todo)}
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
