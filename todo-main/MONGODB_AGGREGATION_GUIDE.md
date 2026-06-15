# MongoDB Aggregation Practice Guide

This guide explains how to design, write, and practice your own MongoDB Aggregation queries in this project.

---

## 1. What is the MongoDB Aggregation Pipeline?

Think of MongoDB Aggregation as an **assembly line** (pipeline) for your data. 
1. Input documents enter the pipeline from a collection (e.g., `todos`).
2. The documents flow through one or more **stages** sequentially.
3. Each stage performs a specific operation (filtering, grouping, renaming, sorting) and outputs the transformed documents to the next stage.
4. The final stage produces the aggregate result.

```
+------------------+     +------------------+     +------------------+
|   $match Stage   | --> |   $group Stage   | --> |  $project Stage  |
|  (Filter items)  |     | (Group & Count)  |     | (Calculate/Reshape)|
+------------------+     +------------------+     +------------------+
```

---

## 2. Core Stages & Cheat Sheet

Here are the most common stages you will use when practicing:

| Stage Name | SQL Equivalent | Description | Example Syntax |
| :--- | :--- | :--- | :--- |
| **`$match`** | `WHERE` | Filters documents so only matches pass to the next stage. | `{ $match: { completed: false } }` |
| **`$group`** | `GROUP BY` | Groups documents by a key and calculates accumulator values. | `{ $group: { _id: "$category", total: { $sum: 1 } } }` |
| **`$project`**| `SELECT` | Adds, removes, or calculates new fields. | `{ $project: { title: 1, upperTitle: { $toUpper: "$title" } } }` |
| **`$sort`** | `ORDER BY` | Sorts documents by specified fields (`1` = Asc, `-1` = Desc). | `{ $sort: { total: -1 } }` |
| **`$limit`** | `LIMIT` | Restricts the number of output documents. | `{ $limit: 5 }` |

---

## 3. Step-by-Step: Writing Your First Pipeline

Let's write a pipeline to find **the completion rate of "work" category todos**.

### Step 1: Filter to "work" tasks using `$match`
We only want to look at tasks whose category is `"work"`:
```javascript
{
  $match: {
    category: 'work'
  }
}
```

### Step 2: Group and compute sums using `$group`
Next, we want to count total tasks and completed tasks.
* Use `_id: null` if you want to combine everything into a single group/total.
* Use `$cond` to conditionally add `1` if completed is `true`, else add `0`.
```javascript
{
  $group: {
    _id: null, // Combine all matching documents into 1 result
    totalCount: { $sum: 1 },
    completedCount: { 
      $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] } 
    }
  }
}
```

### Step 3: Calculate the completion rate percentage using `$project`
Now, divide completed by total, and multiply by 100:
```javascript
{
  $project: {
    _id: 0, // Exclude the _id field from the result
    totalCount: 1,
    completedCount: 1,
    percentage: {
      $multiply: [
        { $divide: ["$completedCount", "$totalCount"] },
        100
      ]
    }
  }
}
```

### Putting it together in Mongoose:
Add this to [src/app/api/todos/analytics/route.js](file:///d:/todo-main/todo-main/src/app/api/todos/analytics/route.js) to test it:
```javascript
const workStats = await Todo.aggregate([
  { $match: { category: 'work' } },
  {
    $group: {
      _id: null,
      totalCount: { $sum: 1 },
      completedCount: { $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] } }
    }
  },
  {
    $project: {
      _id: 0,
      totalCount: 1,
      completedCount: 1,
      percentage: { $multiply: [{ $divide: ["$completedCount", "$totalCount"] }, 100] }
    }
  }
]);
```

---

## 4. Helpful Expression Operators

When inside a `$project` or `$group` stage, you can use these expressions to manipulate data:

* **Conditional Statements (`$cond`)**:
  `{ $cond: [ IF_EXPRESSION, VALUE_IF_TRUE, VALUE_IF_FALSE ] }`
* **Date Parsing (`$dateToString`)**:
  Converts dates (like `createdAt` or `updatedAt`) to simple string formats.
  `{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }`
* **Checking for Null / Empty (`$ifNull`)**:
  Replaces null or undefined values with a default value.
  `{ $ifNull: [ "$dueDate", "No Due Date" ] }`
* **String Utilities**:
  * `{ $toUpper: "$title" }` - converts to uppercase.
  * `{ $strLenCP: "$title" }` - gets the length of a string.

---

## 5. Tips for Aggregation Practice

1. **Order Matters**: Always place `$match` as early as possible. If you filter out records in Stage 1, then Stage 2 (`$group`) has much fewer documents to process, making it much faster.
2. **Check Types**: In Mongoose, virtual properties (like `id` instead of `_id`) are not available inside an aggregation query because aggregation queries run directly on raw MongoDB documents. Always use `_id` in your pipeline!
3. **Use the live Sandbox**: Try editing [src/app/api/todos/analytics/route.js](file:///d:/todo-main/todo-main/src/app/api/todos/analytics/route.js), insert your queries, and visit `http://localhost:3000/api/todos/analytics` to see what they return.
