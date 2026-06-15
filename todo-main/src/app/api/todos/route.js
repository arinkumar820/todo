import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Todo from '@/models/Todo'

export async function GET() {
  try {
    await connectDB()
    const allTodos = await Todo.aggregate([
      { $match: { completed: true } },
      {
        $group: {
          _id: null,
          completedtask: { $sum: 1 }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 1 }
    ])
    const responseData = {
      todos: allTodos,
      source: "mongodb"
    }
    return NextResponse.json(responseData)

  } catch (error) {
    const errors = { error: error.message }
    return NextResponse.json(errors, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const RData = await request.json()
    const NewTodo = new Todo(RData)
    await NewTodo.save()
    return NextResponse.json(NewTodo)

  } catch (error) {
    const errors = { error: error.message }
    return NextResponse.json(errors, { status: 500 })
  }
}