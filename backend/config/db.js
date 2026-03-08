/**
 * connectDB - No-op for Supabase migration
 * Since we are using Supabase, we don't connect to MongoDB anymore.
 */
const connectDB = async () => {
    console.log('Supabase detected. Skipping MongoDB connection.');
    return true;
};

export default connectDB;
