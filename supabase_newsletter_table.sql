-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

-- Enable Row Level Security (RLS)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (for the website form)
CREATE POLICY "Allow public inserts" ON newsletter_subscribers
    FOR INSERT
    WITH CHECK (true);

-- Create policy to allow reads only for authenticated users (for admin dashboard)
CREATE POLICY "Allow authenticated reads" ON newsletter_subscribers
    FOR SELECT
    USING (auth.role() = 'authenticated');
