import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

if(!process.env.DATABASE_URL){
    throw new Error('DATABASE_URL is not defined in the environment variables')
}

export const db = drizzle(process.env.DATABASE_URL)

const checkconnectDb = async () => {
    try{
        await db.execute(sql`SELECT 1`)
        console.log(`\nNeon PostgreSql connected successfully`)
    }catch(err){
        console.error('Neon PostgreSQL connection error:', err);
        process.exit(1);
    }
}

export default checkconnectDb