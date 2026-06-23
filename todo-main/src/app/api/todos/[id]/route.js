import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Todo from '@/models/Todo'
import createtodoSchema from '@/Validation/to.validation'

export async function PUT(request, { params }) {
  try {
    
    await connectDB()

    const newUpdateData = await request.json()
    const todoId = params.id

    const result = createtodoSchema.safeParse(newUpdateData) // Validate the new update data against the schema
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    const updatedTodo = await Todo.findByIdAndUpdate(todoId, newUpdateData, { new: true }).safeParse() // Validate the updated data against the schema

    if (!updatedTodo) {
      const notFoundError = { error: 'Task not found' }
      return NextResponse.json(notFoundError, { status: 404 })
    }
    return NextResponse.json(updatedTodo)

  } 
  catch (error) {

    const errors = { error: error.message }
    return NextResponse.json(errors, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB()
    const todoId = params.id

    
    const deletedTodo = await Todo.findByIdAndDelete(todoId)

    if (!deletedTodo) {
      const notFoundError = { error: 'Task not found' }
      return NextResponse.json(notFoundError, { status: 404 })
    }
    const successMessage = { message: "Todo deleted successfully" }
    return NextResponse.json(successMessage)

  } 
  catch (error) {
    const errors = { error: error.message }
    return NextResponse.json(errors, { status: 500 })
  }
}