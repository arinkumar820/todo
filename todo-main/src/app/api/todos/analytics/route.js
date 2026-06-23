// NEW FILE: Added a dedicated analytics route handler utilizing MongoDB Aggregation Pipelines.
// Stage operations include:
// 1. $group and $project to calculate overall completion percentage, total, completed, and pending tasks.
// 2. $group, $project, and $sort to calculate completion metrics broken down by task categories.
// 3. $match and $count to count active tasks that are past their due date.
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';

export async function GET() {
  try {
    await connectDB();

    // 1. Overall stats aggregation
    const overallAgg = await Todo.aggregate([
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalCount: 1,
          completedCount: 1,
          pendingCount: { $subtract: ['$totalCount', '$completedCount'] },
          percentage: {
            $cond: [
              { $eq: ['$totalCount', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$completedCount', '$totalCount'] }, 100] }, 0] },
            ],
          },
        },
      },
    ]);

    const stats = overallAgg[0] || {
      totalCount: 0,
      completedCount: 0,
      pendingCount: 0,
      percentage: 0,
    };

    // 2. Category breakdown aggregation
    const categoryStats = await Todo.aggregate([
      {
        $group: {
          _id: '$category',
          totalCount: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] } },
        },
      },
      {
        $project: {
          category: '$_id',
          _id: 0,
          totalCount: 1,
          completedCount: 1,
          pendingCount: { $subtract: ['$totalCount', '$completedCount'] },
        },
      },
      { $sort: { totalCount: -1 } },
    ]);

    // 3. Overdue count (only if active and due date has passed)
    const todayStr = new Date().toISOString().split('T')[0];
    
    const overdueAgg = await Todo.aggregate([
      {
        $match: {
          completed: false,
          dueDate: { $ne: '' },
        },
      },
      {
        $match: {
          dueDate: { $lt: todayStr }
        }
      },
      {
        $count: 'overdueCount',
      },
    ]);

    const overdueCount = overdueAgg[0]?.overdueCount || 0;

    return NextResponse.json({
      success: true,
      stats,
      categoryStats,
      overdueCount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
