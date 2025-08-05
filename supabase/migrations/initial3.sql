-- Create a function to get URL by slug that bypasses RLS for private URLs
CREATE OR REPLACE FUNCTION public.get_url_by_slug(slug_param text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  original_url text,
  short_slug text,
  title text,
  description text,
  clicks integer,
  is_private boolean,
  password text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.user_id,
    u.original_url,
    u.short_slug,
    u.title,
    u.description,
    u.clicks,
    u.is_private,
    u.password,
    u.expires_at,
    u.created_at,
    u.updated_at
  FROM public.urls u
  WHERE u.short_slug = slug_param;
END;
$$;
