-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the cleanup function to run every hour
SELECT cron.schedule(
  'cleanup-expired-urls',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://pbfeznqdlyqbtyftoumc.supabase.co/functions/v1/cleanup-expired-urls',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZmV6bnFkbHlxYnR5ZnRvdW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNDg2MTAsImV4cCI6MjA2OTgyNDYxMH0.Nm7RmIG2l5eicLpRq7e-hKa3leMZMSHP8jUi9m2Nim8"}'::jsonb,
        body:='{"trigger": "scheduled"}'::jsonb
    ) as request_id;
  $$
);
