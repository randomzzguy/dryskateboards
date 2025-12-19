-- Create database trigger to call Edge Function when new subscriber is added
CREATE OR REPLACE FUNCTION trigger_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function
  PERFORM
    net.http_post(
      url := 'https://miokevenjpbgzjrnfzfr.supabase.co/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_newsletter_subscribe ON newsletter_subscribers;
CREATE TRIGGER on_newsletter_subscribe
  AFTER INSERT ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_email();
