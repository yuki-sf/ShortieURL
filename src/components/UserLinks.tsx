import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, Trash2, Edit, Eye, EyeOff, Copy, Calendar, BarChart3 } from 'lucide-react';

interface UserUrl {
  id: string;
  original_url: string;
  short_slug: string;
  title: string | null;
  description: string | null;
  clicks: number;
  is_private: boolean;
  password: string | null;
  expires_at: string | null;
  created_at: string;
}

export function UserLinks() {
  const [urls, setUrls] = useState<UserUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUrl, setEditingUrl] = useState<UserUrl | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    password: '',
    is_private: false,
    expires_at: '',
    custom_expiry: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserUrls();
    }
  }, [user]);

  const fetchUserUrls = async () => {
    try {
      const { data, error } = await supabase
        .from('urls')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUrls(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch your links",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUrl = async (id: string) => {
    try {
      const { error } = await supabase
        .from('urls')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUrls(urls.filter(url => url.id !== id));
      toast({
        title: "Deleted",
        description: "Link deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (url: UserUrl) => {
    setEditingUrl(url);
    setEditForm({
      title: url.title || '',
      description: url.description || '',
      password: url.password || '',
      is_private: url.is_private,
      expires_at: url.expires_at ? (new Date(url.expires_at) > new Date() ? 'custom' : 'never') : 'never',
      custom_expiry: url.expires_at ? new Date(url.expires_at).toISOString().slice(0, 16) : ''
    });
  };

  const saveEdit = async () => {
    if (!editingUrl) return;

    try {
      let calculatedExpiresAt = null;
      if (editForm.expires_at && editForm.expires_at !== 'never') {
        const now = new Date();
        switch (editForm.expires_at) {
          case '1hour':
            calculatedExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
            break;
          case '1day':
            calculatedExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case '1week':
            calculatedExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'custom':
            if (editForm.custom_expiry) {
              calculatedExpiresAt = new Date(editForm.custom_expiry);
            }
            break;
        }
      }

      const { error } = await supabase
        .from('urls')
        .update({
          title: editForm.title || null,
          description: editForm.description || null,
          password: editForm.password || null,
          is_private: editForm.is_private,
          expires_at: calculatedExpiresAt
        })
        .eq('id', editingUrl.id);

      if (error) throw error;

      await fetchUserUrls();
      setEditingUrl(null);
      toast({
        title: "Updated",
        description: "Link updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update link",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (slug: string) => {
    const shortUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(shortUrl);
    toast({
      title: "Copied! 📋",
      description: "Short URL copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your links...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Your Links ({urls.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {urls.length === 0 ? (
          <div className="text-center py-8">
            <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No links yet</h3>
            <p className="text-muted-foreground">Create your first short URL above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Short URL</TableHead>
                  <TableHead>Original URL</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urls.map((url) => (
                  <TableRow key={url.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {url.short_slug}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(url.short_slug)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={url.original_url}>
                        {url.original_url}
                      </div>
                    </TableCell>
                    <TableCell>{url.title || '-'}</TableCell>
                    <TableCell>{url.clicks}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {url.is_private && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Private</span>
                        )}
                        {url.password && (
                          <span className="text-xs bg-red-100 text-red-800 px-1 rounded">Protected</span>
                        )}
                        {url.expires_at && new Date(url.expires_at) < new Date() && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-1 rounded">Expired</span>
                        )}
                        {url.expires_at && new Date(url.expires_at) > new Date() && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Expires</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(url.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(url)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Link</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-title">Title</Label>
                                <Input
                                  id="edit-title"
                                  value={editForm.title}
                                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                  placeholder="Link title"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                  placeholder="Link description"
                                  rows={2}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="edit-private">Private</Label>
                                <Switch
                                  id="edit-private"
                                  checked={editForm.is_private}
                                  onCheckedChange={(checked) => setEditForm({...editForm, is_private: checked})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-password">Password</Label>
                                <div className="relative">
                                  <Input
                                    id="edit-password"
                                    type={showPassword ? "text" : "password"}
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                    placeholder="Password protection"
                                    className="pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="edit-expires">Expiration</Label>
                                <Select 
                                  value={editForm.expires_at} 
                                  onValueChange={(value) => setEditForm({...editForm, expires_at: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="never">Never expires</SelectItem>
                                    <SelectItem value="1hour">1 Hour</SelectItem>
                                    <SelectItem value="1day">1 Day</SelectItem>
                                    <SelectItem value="1week">1 Week</SelectItem>
                                    <SelectItem value="custom">Custom Date</SelectItem>
                                  </SelectContent>
                                </Select>
                                {editForm.expires_at === 'custom' && (
                                  <Input
                                    type="datetime-local"
                                    value={editForm.custom_expiry}
                                    onChange={(e) => setEditForm({...editForm, custom_expiry: e.target.value})}
                                    className="mt-2"
                                    min={new Date().toISOString().slice(0, 16)}
                                  />
                                )}
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button onClick={saveEdit} className="flex-1">
                                  Save Changes
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingUrl(null)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUrl(url.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
