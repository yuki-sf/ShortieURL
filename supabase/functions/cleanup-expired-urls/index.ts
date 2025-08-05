import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Starting cleanup of expired URLs...');

    // Get all expired URLs
    const { data: expiredUrls, error: selectError } = await supabase
      .from('urls')
      .select('id, short_slug, expires_at')
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null);

    if (selectError) {
      console.error('Error fetching expired URLs:', selectError);
      throw selectError;
    }

    console.log(`Found ${expiredUrls?.length || 0} expired URLs`);

    if (expiredUrls && expiredUrls.length > 0) {
      // Delete associated clicks first (due to foreign key relationship)
      const urlIds = expiredUrls.map(url => url.id);
      
      const { error: clicksDeleteError } = await supabase
        .from('clicks')
        .delete()
        .in('url_id', urlIds);

      if (clicksDeleteError) {
        console.error('Error deleting clicks:', clicksDeleteError);
        // Continue with URL deletion even if clicks deletion fails
      } else {
        console.log(`Deleted clicks for ${urlIds.length} expired URLs`);
      }

      // Delete the expired URLs
      const { error: deleteError } = await supabase
        .from('urls')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .not('expires_at', 'is', null);

      if (deleteError) {
        console.error('Error deleting expired URLs:', deleteError);
        throw deleteError;
      }

      console.log(`Successfully deleted ${expiredUrls.length} expired URLs`);
    }

    const response = {
      success: true,
      message: `Cleanup completed. Deleted ${expiredUrls?.length || 0} expired URLs.`,
      deletedCount: expiredUrls?.length || 0,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Cleanup function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
