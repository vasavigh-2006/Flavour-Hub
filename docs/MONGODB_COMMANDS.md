# MongoDB Commands to Fix Recipe Index

## Problem
- Unique compound index on `{ userId: 1, mealdbId: 1 }` (or `{ createdBy: 1, mealdbId: 1 }`)
- MongoDB treats missing `mealdbId` as `null`, causing duplicate key errors
- User-created recipes (no `mealdbId`) cannot be saved after the first one

## Solution
Replace the full unique index with a **PARTIAL unique index** that only applies when `mealdbId` exists and is not null.

---

## Step 1: Connect to MongoDB

```bash
mongosh "your-mongodb-connection-string"
# Or if using local MongoDB:
mongosh
```

---

## Step 2: Switch to Your Database

```javascript
use your-database-name
// Replace 'your-database-name' with your actual database name
```

---

## Step 3: Check Current Indexes

```javascript
// List all indexes on the recipes collection
db.recipes.getIndexes()

// Or get specific index details
db.recipes.getIndexes().forEach(idx => {
  if (idx.key.mealdbId || idx.key.userId || idx.key.createdBy) {
    printjson(idx);
  }
});
```

---

## Step 4: Drop Old Unique Indexes

```javascript
// Try dropping index with userId (if it exists)
try {
  db.recipes.dropIndex("userId_1_mealdbId_1");
  print("✅ Dropped index: userId_1_mealdbId_1");
} catch (e) {
  if (e.code === 27) {
    print("ℹ️  Index userId_1_mealdbId_1 does not exist");
  } else {
    print("⚠️  Error: " + e.message);
  }
}

// Try dropping index with createdBy (if it exists)
try {
  db.recipes.dropIndex("createdBy_1_mealdbId_1");
  print("✅ Dropped index: createdBy_1_mealdbId_1");
} catch (e) {
  if (e.code === 27) {
    print("ℹ️  Index createdBy_1_mealdbId_1 does not exist");
  } else {
    print("⚠️  Error: " + e.message);
  }
}
```

---

## Step 5: Create Partial Unique Index

```javascript
// Create PARTIAL unique index - only enforces uniqueness when mealdbId exists
db.recipes.createIndex(
  { createdBy: 1, mealdbId: 1 },
  {
    unique: true,
    partialFilterExpression: { mealdbId: { $exists: true, $ne: null } },
    name: "createdBy_1_mealdbId_1"
  }
);

print("✅ Created partial unique index: createdBy_1_mealdbId_1");
```

---

## Step 6: Verify the Index

```javascript
// Check the index was created correctly
db.recipes.getIndexes().forEach(idx => {
  if (idx.name === "createdBy_1_mealdbId_1") {
    printjson(idx);
  }
});

// Expected output should show:
// {
//   "v": 2,
//   "key": { "createdBy": 1, "mealdbId": 1 },
//   "name": "createdBy_1_mealdbId_1",
//   "unique": true,
//   "partialFilterExpression": { "mealdbId": { "$exists": true, "$ne": null } }
// }
```

---

## Step 7: Test the Fix

```javascript
// Test 1: Check if multiple user-created recipes (no mealdbId) exist for same user
db.recipes.aggregate([
  {
    $match: {
      mealdbId: { $exists: false },
      createdBy: { $exists: true, $ne: null }
    }
  },
  {
    $group: {
      _id: "$createdBy",
      count: { $sum: 1 },
      recipeIds: { $push: "$_id" }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
]);

// Test 2: Verify MealDB recipes (with mealdbId) are still unique per user
db.recipes.aggregate([
  {
    $match: {
      mealdbId: { $exists: true, $ne: null },
      createdBy: { $exists: true, $ne: null }
    }
  },
  {
    $group: {
      _id: { createdBy: "$createdBy", mealdbId: "$mealdbId" },
      count: { $sum: 1 },
      recipeIds: { $push: "$_id" }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
]);
// This should return empty array (no duplicates allowed)
```

---

## Step 8: Verify Index Behavior

```javascript
// Count total indexes
db.recipes.getIndexes().length

// List all index names
db.recipes.getIndexes().forEach(idx => print(idx.name));

// Check index usage stats (if available)
db.recipes.aggregate([{ $indexStats: {} }])
```

---

## Alternative: Using Mongoose Migration Script

If you prefer to use the provided Node.js script:

```bash
node fix-recipe-index.js
```

This script will:
1. Connect to MongoDB
2. Drop old indexes automatically
3. Create the new partial index
4. Verify the index was created correctly
5. Test that multiple user-created recipes can exist

---

## Expected Results

After applying the fix:

✅ **User-created recipes** (no `mealdbId`):
- Multiple recipes per user are allowed
- No duplicate key errors

✅ **MealDB recipes** (with `mealdbId`):
- Only one recipe per `mealdbId` per user
- Duplicate MealDB recipes are prevented

---

## Troubleshooting

### Error: "Index already exists"
```javascript
// Drop the index first, then recreate
db.recipes.dropIndex("createdBy_1_mealdbId_1");
```

### Error: "Cannot create index with duplicate values"
```javascript
// Find and remove duplicates first
db.recipes.aggregate([
  {
    $match: { mealdbId: { $exists: true, $ne: null } }
  },
  {
    $group: {
      _id: { createdBy: "$createdBy", mealdbId: "$mealdbId" },
      count: { $sum: 1 },
      ids: { $push: "$_id" }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
]).forEach(doc => {
  // Keep the first one, delete the rest
  const toDelete = doc.ids.slice(1);
  db.recipes.deleteMany({ _id: { $in: toDelete } });
});
```

### Verify Index is Partial
```javascript
const index = db.recipes.getIndexes().find(idx => idx.name === "createdBy_1_mealdbId_1");
if (index.partialFilterExpression) {
  print("✅ Index is partial - correct!");
} else {
  print("❌ Index is NOT partial - needs to be recreated");
}
```

