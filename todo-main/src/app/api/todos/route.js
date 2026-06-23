// CHANGED: Imported createtodoSchema from validation. Changed GET handler to retrieve
// and return all todos sorted by createdAt rather than using a broken aggregation pipeline.
// Improved POST error formatting to return detailed validation error messages.
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Todo from '@/models/Todo'
import { createtodoSchema } from '@/Validation/to.validation'

export async function GET() {
  try {
    await connectDB()
    const allTodos = await Todo.find().sort({ createdAt: -1 })
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
      // Return a clean error message from Zod validation
      const errorMessage = result.error.errors.map(err => err.message).join(', ')
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
    const NewTodo = new Todo(result.data) // Use the validated data to create a new Todo
    await NewTodo.save()
    return NextResponse.json(NewTodo)

  } catch (error) {
    const errors = { error: error.message }
    return NextResponse.json(errors, { status: 500 })
  }
}