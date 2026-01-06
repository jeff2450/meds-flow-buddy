import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Pill, Wifi, WifiOff, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  isOnline, 
  verifyOfflineCredentials, 
  setOfflineSession, 
  getOfflineSession,
  cacheCredentials 
} from "@/lib/offlineAuth";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type LoginRole = "worker" | "admin";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [selectedRole, setSelectedRole] = useState<LoginRole>("worker");

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
        return;
      }
      
      // If offline, check for offline session
      if (!isOnline()) {
        const offlineSession = getOfflineSession();
        if (offlineSession) {
          navigate("/");
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("login-email") as string;
    const password = formData.get("login-password") as string;

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);

      if (online) {
        // Online login via Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: error.message,
          });
        } else if (data.user) {
          // Fetch user roles and profile for caching
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id);

          const userRoles = roles?.map(r => r.role) || [];
          
          // Verify user has the selected role
          if (!userRoles.includes(selectedRole)) {
            await supabase.auth.signOut();
            toast({
              variant: "destructive",
              title: "Access denied",
              description: `You don't have ${selectedRole === 'admin' ? 'Admin' : 'Staff'} access. Please select the correct role.`,
            });
            setLoading(false);
            return;
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', data.user.id)
            .single();

          // Cache credentials for offline use
          await cacheCredentials(
            email,
            password,
            data.user.id,
            profile?.full_name || null,
            userRoles
          );

          toast({
            title: "Login successful",
            description: `Logged in as ${selectedRole === 'admin' ? 'Admin' : 'Staff'}. Credentials cached for offline access.`,
          });
        }
      } else {
        // Offline login using cached credentials
        const result = await verifyOfflineCredentials(email, password);
        
        if (result.success && result.user) {
          // Verify user has the selected role in cached credentials
          if (!result.user.roles.includes(selectedRole)) {
            toast({
              variant: "destructive",
              title: "Access denied",
              description: `You don't have ${selectedRole === 'admin' ? 'Admin' : 'Staff'} access with cached credentials.`,
            });
            setLoading(false);
            return;
          }
          
          setOfflineSession(result.user);
          toast({
            title: "Offline login successful",
            description: `You're working in offline mode as ${selectedRole === 'admin' ? 'Admin' : 'Staff'}.`,
          });
          navigate("/");
        } else {
          toast({
            variant: "destructive",
            title: "Offline login failed",
            description: "No cached credentials found. Please login while online first.",
          });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: error.errors[0].message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!online) {
      toast({
        variant: "destructive",
        title: "Internet required",
        description: "You need to be online to create a new account.",
      });
      return;
    }
    
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const fullName = formData.get("signup-name") as string;

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Account created",
          description: "You've been assigned as a Staff member. Contact an admin for Admin access.",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: error.errors[0].message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-primary rounded-full">
              <Pill className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Pharmaceutical Inventory</CardTitle>
          <CardDescription>Select your role to continue</CardDescription>
          
          {/* Online/Offline Status */}
          <div className="flex justify-center mt-3">
            <Badge 
              variant={online ? "default" : "secondary"} 
              className="flex items-center gap-1.5"
            >
              {online ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline Mode
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Role Selection */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Login as:</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={selectedRole === "worker" ? "default" : "outline"}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedRole("worker")}
              >
                <User className="h-6 w-6" />
                <span>Staff</span>
              </Button>
              <Button
                type="button"
                variant={selectedRole === "admin" ? "default" : "outline"}
                className="h-20 flex-col gap-2"
                onClick={() => setSelectedRole("admin")}
              >
                <Shield className="h-6 w-6" />
                <span>Admin</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup" disabled={!online}>Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {!online && (
                  <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Offline Login</p>
                    <p>Use your previously cached credentials to sign in.</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="login-email"
                    type="email"
                    placeholder={selectedRole === "admin" ? "admin@pharmacy.com" : "staff@pharmacy.com"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="login-password"
                    type="password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : `Sign In as ${selectedRole === 'admin' ? 'Admin' : 'Staff'}`}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground mb-2">
                  <p>New accounts are automatically assigned Staff role. Contact an admin for Admin access.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="signup-name"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    placeholder="staff@pharmacy.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="signup-password"
                    type="password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Staff Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
