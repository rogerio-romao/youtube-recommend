import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// Get the database URL from runtime config or environment
const databaseUrl = process.env.DATABASE_URL || 'file:./data/youtube-recommend.db'

// Parse the file path from the URL
const dbPath = databaseUrl.replace('file:', '')

// Create the SQLite database connection
const sqlite = new Database(dbPath)

// Enable WAL mode for better concurrent performance
sqlite.pragma('journal_mode = WAL')

// Create the Drizzle ORM instance
export const db = drizzle(sqlite, { schema })

// Export schema for convenience
export { schema }
