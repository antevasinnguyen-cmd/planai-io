'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, GripVertical } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface TodoItem {
  id: string
  title: string
  completed: boolean
  created_at: string
}

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done' | 'no_status'
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

export default function ProgressPage() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskStatus, setNewTaskStatus] = useState<'todo' | 'in_progress' | 'done' | 'no_status'>('todo')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [showTaskForm, setShowTaskForm] = useState(false)

  // Load data from localStorage
  useEffect(() => {
    if (user?.id) {
      const savedTodos = localStorage.getItem(`progress_todos_${user.id}`)
      const savedTasks = localStorage.getItem(`progress_tasks_${user.id}`)
      if (savedTodos) setTodos(JSON.parse(savedTodos))
      if (savedTasks) setTasks(JSON.parse(savedTasks))
    }
  }, [user?.id])

  // Save todos to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`progress_todos_${user.id}`, JSON.stringify(todos))
    }
  }, [todos, user?.id])

  // Save tasks to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`progress_tasks_${user.id}`, JSON.stringify(tasks))
    }
  }, [tasks, user?.id])

  const addTodo = () => {
    if (newTodoTitle.trim()) {
      setTodos([...todos, {
        id: Date.now().toString(),
        title: newTodoTitle,
        completed: false,
        created_at: new Date().toISOString()
      }])
      setNewTodoTitle('')
    }
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? {...t, completed: !t.completed} : t))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id))
  }

  const addTask = () => {
    if (newTaskTitle.trim()) {
      setTasks([...tasks, {
        id: Date.now().toString(),
        title: newTaskTitle,
        description: newTaskDescription,
        status: newTaskStatus,
        priority: newTaskPriority,
        created_at: new Date().toISOString()
      }])
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskStatus('todo')
      setNewTaskPriority('medium')
      setShowTaskForm(false)
    }
  }

  const updateTaskStatus = (id: string, status: 'todo' | 'in_progress' | 'done' | 'no_status') => {
    setTasks(tasks.map(t => t.id === id ? {...t, status} : t))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const getTasksByStatus = (status: 'todo' | 'in_progress' | 'done' | 'no_status') => {
    return tasks.filter(t => t.status === status)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      case 'low': return 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400'
      default: return 'bg-gray-100 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400'
    }
  }

  const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    no_status: 'No Status'
  }

  const statusColors = {
    todo: 'bg-gray-100 dark:bg-gray-800',
    in_progress: 'bg-blue-100 dark:bg-blue-900/30',
    done: 'bg-green-100 dark:bg-green-900/30',
    no_status: 'bg-gray-50 dark:bg-gray-900/50'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Quay lại Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tiến độ
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý To-do list và Task board để theo dõi tiến độ kế hoạch tài chính của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* To-do List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">To-do List</h2>
              
              {/* Add new todo */}
              <div className="mb-4 space-y-2">
                <input
                  type="text"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="Thêm công việc mới..."
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={addTodo}
                  className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Thêm
                </button>
              </div>

              {/* Todo list */}
              <div className="space-y-2">
                {todos.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Chưa có công việc nào</p>
                ) : (
                  todos.map(todo => (
                    <div key={todo.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className="flex-shrink-0"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {todo.title}
                      </span>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Task Board */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Board</h2>
                <button
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Thêm Task
                </button>
              </div>

              {/* Add new task form */}
              {showTaskForm && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3 border border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Tiêu đề task..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Mô tả (tùy chọn)..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newTaskStatus}
                      onChange={(e) => setNewTaskStatus(e.target.value as any)}
                      className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="no_status">No Status</option>
                    </select>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addTask}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setShowTaskForm(false)}
                      className="flex-1 px-3 py-2 bg-gray-400 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Task columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['todo', 'in_progress', 'done', 'no_status'] as const).map(status => (
                  <div key={status} className={`${statusColors[status]} rounded-lg p-4 min-h-[400px]`}>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                      {statusLabels[status]}
                    </h3>
                    <div className="space-y-2">
                      {getTasksByStatus(status).map(task => (
                        <div key={task.id} className="bg-white dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200 dark:border-gray-700 group hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex-1">{task.title}</h4>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
                            </button>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                            <select
                              value={task.status}
                              onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                              className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="done">Done</option>
                              <option value="no_status">No Status</option>
                            </select>
                          </div>
                        </div>
                      ))}
                      {getTasksByStatus(status).length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">Không có task</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
