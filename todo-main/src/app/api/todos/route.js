import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Todo from '@/models/Todo'


export async function GET() {
  try {
    await connectDB()
    const allTodos = await Todo.aggregate([
      { $match: { completed: true }  },
      {
        $group: {
          _id: "$completed",
          completedtask: { $sum: 1 },
        }
      },
      { $sort: { createdAt: -1 } },
      { project: { _id:0,
        title:1,
        category:1,
        
       } }
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
    const result = createtodoSchema.safeParse(RData) // Validate the request data against the schema
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }
    const NewTodo = new Todo(result.data) // Use the validated data to create a new Todo
    await NewTodo.save()
    return NextResponse.json(NewTodo)

  } catch (error) {
    const errors = { error: error.message }
    return NextResponse.json(errors, { status: 500 })
  }
}