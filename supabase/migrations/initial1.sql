CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create URLs table
CREATE TABLE public.urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  short_slug TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  clicks INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT false,
  password TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.urls ENABLE ROW LEVEL SECURITY;

-- Create policies for URLs
CREATE POLICY "Users can view their own URLs" 
ON public.urls 
FOR SELECT 
USING (auth.uid() = user_id OR is_private = false);

CREATE POLICY "Users can create URLs" 
ON public.urls 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own URLs" 
ON public.urls 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own URLs" 
ON public.urls 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create clicks table for analytics
CREATE TABLE public.clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id UUID REFERENCES public.urls(id) ON DELETE CASCADE NOT NULL,
  user_agent TEXT,
  referer TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  browser TEXT,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

-- Create policies for clicks
CREATE POLICY "URL owners can view clicks" 
ON public.clicks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.urls 
    WHERE urls.id = clicks.url_id 
    AND urls.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert clicks" 
ON public.clicks 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_urls_updated_at
  BEFORE UPDATE ON public.urls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_urls_short_slug ON public.urls(short_slug);
CREATE INDEX idx_urls_user_id ON public.urls(user_id);
CREATE INDEX idx_clicks_url_id ON public.clicks(url_id);
CREATE INDEX idx_clicks_created_at ON public.clicks(created_at);
