import db from "./db.js";

async function addDateOfBirthColumn() {
  try {
    console.log("Checking if dateofbirth column exists...");
    
    // Check if column exists by trying to add it (PostgreSQL will error if it exists)
    const columnExists = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='dateofbirth'
    `);
    
    if (columnExists.rows.length > 0) {
      console.log("✅ dateofbirth column already exists!");
      process.exit(0);
    }
    
    console.log("Adding dateofbirth column to users table...");
    await db.raw(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS dateofbirth VARCHAR(255)
    `);
    
    console.log("✅ dateofbirth column added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding dateofbirth column:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

addDateOfBirthColumn();


