import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Link,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Copy,
  Calendar,
  BarChart3,
  ArrowUpRight,
  Shield,
} from 'lucide-react';

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
    custom_expiry: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserUrls();

      const channel = supabase
        .channel('url-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'urls',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchUserUrls();
          }
        )
        .subscribe();

      const interval = setInterval(() => {
        fetchUserUrls();
      }, 10000);

      const handleFocus = () => {
        fetchUserUrls();
      };

      window.addEventListener('focus', handleFocus);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
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
        title: 'Error',
        description: 'Failed to fetch your links',
        variant: 'destructive',
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

      setUrls(urls.filter((url) => url.id !== id));

      toast({
        title: 'Deleted',
        description: 'Link deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete link',
        variant: 'destructive',
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
      expires_at: url.expires_at
        ? new Date(url.expires_at) > new Date()
          ? 'custom'
          : 'never'
        : 'never',
      custom_expiry: url.expires_at
        ? new Date(url.expires_at).toISOString().slice(0, 16)
        : '',
    });
  };

  const saveEdit = async () => {
    if (!editingUrl) return;

    try {
      let calculatedExpiresAt: Date | null = null;

      if (
        editForm.expires_at &&
        editForm.expires_at !== 'never'
      ) {
        const now = new Date();

        switch (editForm.expires_at) {
          case '1hour':
            calculatedExpiresAt = new Date(
              now.getTime() + 60 * 60 * 1000
            );
            break;

          case '1day':
            calculatedExpiresAt = new Date(
              now.getTime() + 24 * 60 * 60 * 1000
            );
            break;

          case '1week':
            calculatedExpiresAt = new Date(
              now.getTime() + 7 * 24 * 60 * 60 * 1000
            );
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
          expires_at: calculatedExpiresAt,
        })
        .eq('id', editingUrl.id);

      if (error) throw error;

      await fetchUserUrls();

      setEditingUrl(null);

      toast({
        title: 'Updated',
        description: 'Link updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update link',
        variant: 'destructive',
      });
    }
  };

  const getShortUrlBase = () => {
    const source = new URLSearchParams(window.location.search).get('source');
  
    if (source === 'yukisf') {
      return 'https://www.yukisf.me/url-shortie';
    }
  
    return window.location.origin;
  };

  const copyToClipboard = (slug: string) => {
    const shortUrl = `${getShortUrlBase()}/${slug}`;
  
    navigator.clipboard.writeText(shortUrl);
  
    toast({
      title: 'Copied',
      description: 'Short URL copied to clipboard',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatus = (url: UserUrl) => {
    const statuses = [];

    if (url.is_private) {
      statuses.push(
        <span
          key="private"
          className="inline-flex items-center gap-1 border border-black px-2 py-1 text-[10px] uppercase tracking-wider"
        >
          <Shield className="h-3 w-3" />
          Private
        </span>
      );
    }

    if (url.password) {
      statuses.push(
        <span
          key="protected"
          className="inline-flex items-center gap-1 border border-black px-2 py-1 text-[10px] uppercase tracking-wider"
        >
          Protected
        </span>
      );
    }

    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      statuses.push(
        <span
          key="expired"
          className="inline-flex items-center gap-1 border border-black bg-black px-2 py-1 text-[10px] uppercase tracking-wider text-white"
        >
          Expired
        </span>
      );
    }

    if (url.expires_at && new Date(url.expires_at) > new Date()) {
      statuses.push(
        <span
          key="expires"
          className="inline-flex items-center gap-1 border border-black px-2 py-1 text-[10px] uppercase tracking-wider"
        >
          <Calendar className="h-3 w-3" />
          Expires
        </span>
      );
    }

    return statuses.length ? statuses : (
      <span className="text-xs text-muted-foreground">Active</span>
    );
  };

  if (loading) {
    return (
      <section className="w-full max-w-6xl mx-auto border border-black bg-white shadow-[6px_6px_0_#171717]">
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 h-6 w-6 animate-spin border-2 border-black border-t-transparent" />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Loading your links
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-6xl mx-auto border border-black bg-white shadow-[6px_6px_0_#171717]">
      {/* Header */}
      <div className="border-b border-black px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              04 / YOUR LINKS
            </p>

            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5" />
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Your links
              </h2>
            </div>
          </div>

          <div className="border border-black px-3 py-2 font-mono text-sm">
            {urls.length.toString().padStart(2, '0')} links
          </div>
        </div>
      </div>

      {urls.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-black">
            <Link className="h-6 w-6" />
          </div>

          <h3 className="mb-2 text-xl font-bold">
            Nothing here yet.
          </h3>

          <p className="text-sm text-muted-foreground">
            Create your first short URL above.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-black bg-[#f1f1ee] text-left">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">
                    Short URL
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {urls.map((url) => (
                  <tr
                    key={url.id}
                    className="border-b border-black/10 transition-colors hover:bg-[#f7f7f5]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <code className="border border-black bg-[#f1f1ee] px-2 py-1 font-mono text-xs">
                          /{url.short_slug}
                        </code>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(url.short_slug)}
                          className="h-7 w-7 rounded-none p-0 hover:bg-black hover:text-white"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <div
                        className="truncate text-xs text-muted-foreground"
                        title={url.original_url}
                      >
                        {url.original_url}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {url.title || '—'}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono font-bold">
                        {url.clicks}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-[150px] flex-wrap gap-1">
                        {getStatus(url)}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">
                      {formatDate(url.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(url)}
                              className="h-8 w-8 rounded-none p-0 hover:bg-black hover:text-white"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="rounded-none border-2 border-black bg-[#f7f7f5] shadow-[8px_8px_0_#171717] sm:max-w-lg">
                            <DialogHeader>
                              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                                Edit / {url.short_slug}
                              </p>

                              <DialogTitle className="text-2xl font-black">
                                Edit link
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-5 pt-3">
                              <div className="space-y-2">
                                <Label htmlFor="edit-title">
                                  Title
                                </Label>

                                <Input
                                  id="edit-title"
                                  value={editForm.title}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder="Link title"
                                  className="h-11 rounded-none border-black bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-description">
                                  Description
                                </Label>

                                <Textarea
                                  id="edit-description"
                                  value={editForm.description}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Link description"
                                  rows={3}
                                  className="rounded-none border-black bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>

                              <div className="flex items-center justify-between border border-black bg-white p-4">
                                <div>
                                  <Label htmlFor="edit-private">
                                    Private link
                                  </Label>

                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Restrict visibility for this link.
                                  </p>
                                </div>

                                <Switch
                                  id="edit-private"
                                  checked={editForm.is_private}
                                  onCheckedChange={(checked) =>
                                    setEditForm({
                                      ...editForm,
                                      is_private: checked,
                                    })
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-password">
                                  Password
                                </Label>

                                <div className="relative">
                                  <Input
                                    id="edit-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={editForm.password}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        password: e.target.value,
                                      })
                                    }
                                    placeholder="Password protection"
                                    className="h-11 rounded-none border-black bg-white pr-10 focus-visible:ring-0 focus-visible:ring-offset-0"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black"
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-expires">
                                  Expiration
                                </Label>

                                <Select
                                  value={editForm.expires_at}
                                  onValueChange={(value) =>
                                    setEditForm({
                                      ...editForm,
                                      expires_at: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-11 rounded-none border-black bg-white focus:ring-0">
                                    <SelectValue />
                                  </SelectTrigger>

                                  <SelectContent className="rounded-none border-black">
                                    <SelectItem value="never">
                                      Never expires
                                    </SelectItem>
                                    <SelectItem value="1hour">
                                      1 Hour
                                    </SelectItem>
                                    <SelectItem value="1day">
                                      1 Day
                                    </SelectItem>
                                    <SelectItem value="1week">
                                      1 Week
                                    </SelectItem>
                                    <SelectItem value="custom">
                                      Custom Date
                                    </SelectItem>
                                  </SelectContent>
                                </Select>

                                {editForm.expires_at === 'custom' && (
                                  <Input
                                    type="datetime-local"
                                    value={editForm.custom_expiry}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        custom_expiry: e.target.value,
                                      })
                                    }
                                    className="mt-2 h-11 rounded-none border-black bg-white focus-visible:ring-0"
                                    min={new Date()
                                      .toISOString()
                                      .slice(0, 16)}
                                  />
                                )}
                              </div>

                              <div className="flex gap-2 border-t border-black pt-5">
                                <Button
                                  onClick={saveEdit}
                                  className="h-11 flex-1 rounded-none bg-black text-white hover:bg-black/90"
                                >
                                  Save Changes
                                </Button>

                                <Button
                                  variant="outline"
                                  onClick={() => setEditingUrl(null)}
                                  className="h-11 flex-1 rounded-none border-black bg-transparent"
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
                          className="h-8 w-8 rounded-none p-0 text-destructive hover:bg-black hover:text-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-black/10 md:hidden">
            {urls.map((url) => (
              <div key={url.id} className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Short URL
                    </p>

                    <code className="inline-block border border-black bg-[#f1f1ee] px-2 py-1 font-mono text-xs">
                      /{url.short_slug}
                    </code>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(url.short_slug)}
                      className="h-8 w-8 rounded-none p-0 hover:bg-black hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(url)}
                          className="h-8 w-8 rounded-none p-0 hover:bg-black hover:text-white"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-black bg-[#f7f7f5] shadow-[8px_8px_0_#171717]">
                        <DialogHeader>
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                            Edit / {url.short_slug}
                          </p>

                          <DialogTitle className="text-2xl font-black">
                            Edit link
                          </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-5 pt-3">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-title-${url.id}`}>
                              Title
                            </Label>

                            <Input
                              id={`edit-title-${url.id}`}
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Link title"
                              className="h-11 rounded-none border-black bg-white focus-visible:ring-0"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-description-${url.id}`}>
                              Description
                            </Label>

                            <Textarea
                              id={`edit-description-${url.id}`}
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Link description"
                              rows={3}
                              className="rounded-none border-black bg-white focus-visible:ring-0"
                            />
                          </div>

                          <div className="flex items-center justify-between border border-black bg-white p-4">
                            <Label htmlFor={`edit-private-${url.id}`}>
                              Private link
                            </Label>

                            <Switch
                              id={`edit-private-${url.id}`}
                              checked={editForm.is_private}
                              onCheckedChange={(checked) =>
                                setEditForm({
                                  ...editForm,
                                  is_private: checked,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-password-${url.id}`}>
                              Password
                            </Label>

                            <div className="relative">
                              <Input
                                id={`edit-password-${url.id}`}
                                type={showPassword ? 'text' : 'password'}
                                value={editForm.password}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    password: e.target.value,
                                  })
                                }
                                placeholder="Password protection"
                                className="h-11 rounded-none border-black bg-white pr-10 focus-visible:ring-0"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setShowPassword(!showPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Expiration</Label>

                            <Select
                              value={editForm.expires_at}
                              onValueChange={(value) =>
                                setEditForm({
                                  ...editForm,
                                  expires_at: value,
                                })
                              }
                            >
                              <SelectTrigger className="h-11 rounded-none border-black bg-white focus:ring-0">
                                <SelectValue />
                              </SelectTrigger>

                              <SelectContent className="rounded-none border-black">
                                <SelectItem value="never">
                                  Never expires
                                </SelectItem>
                                <SelectItem value="1hour">
                                  1 Hour
                                </SelectItem>
                                <SelectItem value="1day">
                                  1 Day
                                </SelectItem>
                                <SelectItem value="1week">
                                  1 Week
                                </SelectItem>
                                <SelectItem value="custom">
                                  Custom Date
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            {editForm.expires_at === 'custom' && (
                              <Input
                                type="datetime-local"
                                value={editForm.custom_expiry}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    custom_expiry: e.target.value,
                                  })
                                }
                                className="mt-2 h-11 rounded-none border-black bg-white focus-visible:ring-0"
                                min={new Date()
                                  .toISOString()
                                  .slice(0, 16)}
                              />
                            )}
                          </div>

                          <div className="flex gap-2 border-t border-black pt-5">
                            <Button
                              onClick={saveEdit}
                              className="h-11 flex-1 rounded-none bg-black text-white"
                            >
                              Save Changes
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => setEditingUrl(null)}
                              className="h-11 flex-1 rounded-none border-black"
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
                      className="h-8 w-8 rounded-none p-0 text-destructive hover:bg-black hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Destination
                  </p>

                  <p
                    className="truncate text-xs text-muted-foreground"
                    title={url.original_url}
                  >
                    {url.original_url}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-px border border-black bg-black">
                  <div className="bg-white p-3">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Clicks
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold">
                      {url.clicks}
                    </p>
                  </div>

                  <div className="bg-white p-3">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Created
                    </p>
                    <p className="mt-1 text-xs">
                      {formatDate(url.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {getStatus(url)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
