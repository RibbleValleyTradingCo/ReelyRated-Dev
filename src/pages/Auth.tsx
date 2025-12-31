import { useEffect, useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Chrome } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { signInSchema, signUpSchema, type SignInFormData, type SignUpFormData } from "@/schemas";
import { LoadingState } from "@/components/ui/LoadingState";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthReady, session } = useAuth();
  const [searchParams] = useSearchParams();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const resetParam = searchParams.get("reset_password") === "1";
  const [authView, setAuthView] = useState<"auth" | "forgot" | "reset">(resetParam ? "reset" : "auth");
  const idPrefix = useId();
  const signInEmailErrorId = `${idPrefix}-signin-email-error`;
  const signInPasswordErrorId = `${idPrefix}-signin-password-error`;
  const signUpUsernameErrorId = `${idPrefix}-signup-username-error`;
  const signUpEmailErrorId = `${idPrefix}-signup-email-error`;
  const signUpPasswordErrorId = `${idPrefix}-signup-password-error`;
  const resetEmailErrorId = `${idPrefix}-reset-email-error`;
  const newPasswordErrorId = `${idPrefix}-new-password-error`;
  const confirmPasswordErrorId = `${idPrefix}-confirm-password-error`;
  const genericResetMessage = "If an account exists for that email, we've sent a reset link.";
  const genericSignInMessage = "Unable to sign in. Please check your details and try again.";
  const genericSignUpMessage = "Unable to create an account. Please check your details and try again.";

  // Sign In Form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Sign Up Form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const resetRequestForm = useForm<{ email: string }>({
    defaultValues: { email: "" },
  });

  const resetPasswordForm = useForm<{ newPassword: string; confirmPassword: string }>({
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!loading && user && authView !== "reset") {
      navigate("/");
    }
  }, [user, loading, navigate, authView]);

  useEffect(() => {
    if (resetParam) {
      setAuthView("reset");
    }
  }, [resetParam]);

  const handleSignIn = async (data: SignInFormData) => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(genericSignInMessage);
      return;
    }

    const authUser = signInData?.user;
    if (!authUser) {
      toast.error("Something went wrong signing you in. Please try again.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_deleted")
      .eq("id", authUser.id)
      .maybeSingle();

    signInForm.reset();
    if (!profileError && profile?.is_deleted) {
      toast.info("This account has been deleted. You can’t reuse this account or email address.");
      // DeletedAccountGate will handle sign-out + redirect.
    } else {
      toast.success("Welcome back!");
      navigate("/");
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    // Check if email already exists using RPC function
    const { data: emailExists, error: emailCheckError } = await supabase
      .rpc('check_email_exists', {
        email_to_check: data.email.toLowerCase()
      });

    if (emailCheckError) {
      console.error('Error checking email:', emailCheckError);
      // Continue anyway - better to allow signup than block it
    } else if (emailExists) {
      toast.error(genericSignUpMessage);
      return;
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', data.username.toLowerCase())
      .maybeSingle();

    if (existingUsername) {
      toast.error(genericSignUpMessage);
      return;
    }

    // Proceed with signup
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth`,
        data: {
          username: data.username,
        },
      },
    });

    if (error) {
      toast.error(genericSignUpMessage);
    } else {
      toast.success("Account created! Check your email to verify!");
    }
  };

  const handleResetRequest = async (data: { email: string }) => {
    const email = data.email.trim();
    if (!email) {
      resetRequestForm.setError("email", { message: "Please enter an email address." });
      return;
    }
    resetRequestForm.clearErrors("email");
    try {
      const redirectTo = `${import.meta.env.VITE_APP_URL || window.location.origin}/auth?reset_password=1`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) {
        throw error;
      }
      toast.success(genericResetMessage);
      resetRequestForm.reset();
      setAuthView("auth");
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Failed to send reset link", error);
      toast.success(genericResetMessage); // Generic to avoid email enumeration
    }
  };

  const handleResetPassword = async (data: { newPassword: string; confirmPassword: string }) => {
    if (!session) {
      toast.error("This link has expired or is invalid. Please request a new reset email.");
      return;
    }
    resetPasswordForm.clearErrors();
    const trimmedNew = data.newPassword.trim();
    const trimmedConfirm = data.confirmPassword.trim();

    if (!trimmedNew || trimmedNew.length < 8) {
      resetPasswordForm.setError("newPassword", {
        message: "Use at least 8 characters for your new password.",
      });
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      resetPasswordForm.setError("confirmPassword", {
        message: "Passwords do not match.",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: trimmedNew });
      if (error) {
        throw error;
      }
      toast.success("Your password has been updated.");
      resetPasswordForm.reset();
      setAuthView("auth");
      navigate("/");
    } catch (error) {
      console.error("Failed to update password", error);
      toast.error("Unable to update your password right now.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        toast.error(error.message ?? "Unable to sign in with Google.");
        setIsGoogleLoading(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in with Google.");
      setIsGoogleLoading(false);
    }
  };

  if (loading || !isAuthReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <LoadingState message="Loading your account…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6 py-6">
        <Section>
          <div className="flex min-h-[80vh] items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center space-y-3">
                <div className="flex justify-center">
                  <LogoMark className="h-16 w-16" />
                </div>
                <Heading as="h1" size="lg" className="text-foreground">
                  ReelyRated
                </Heading>
                <Text variant="muted" className="text-sm">
                  Log your freshwater sessions and join the community
                </Text>
              </CardHeader>
              <CardContent>
                {authView === "auth" && (
                  <Tabs defaultValue="signin" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="signin">Sign In</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    <TabsContent value="signin">
                      <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email">Email</Label>
                          <Input
                            id="signin-email"
                            type="email"
                            autoComplete="email"
                            {...signInForm.register("email")}
                            aria-invalid={!!signInForm.formState.errors.email}
                            aria-describedby={
                              signInForm.formState.errors.email ? signInEmailErrorId : undefined
                            }
                          />
                          {signInForm.formState.errors.email && (
                            <p id={signInEmailErrorId} className="text-sm text-destructive" role="alert">
                              {signInForm.formState.errors.email.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signin-password">Password</Label>
                          <Input
                            id="signin-password"
                            type="password"
                            autoComplete="current-password"
                            {...signInForm.register("password")}
                            aria-invalid={!!signInForm.formState.errors.password}
                            aria-describedby={
                              signInForm.formState.errors.password ? signInPasswordErrorId : undefined
                            }
                          />
                          {signInForm.formState.errors.password && (
                            <p id={signInPasswordErrorId} className="text-sm text-destructive" role="alert">
                              {signInForm.formState.errors.password.message}
                            </p>
                          )}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                              onClick={() => setAuthView("forgot")}
                            >
                              Forgot password?
                            </button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={signInForm.formState.isSubmitting}>
                          {signInForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                      <div className="my-6 flex items-center gap-4">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                      >
                        <Chrome className="h-4 w-4" />
                        {isGoogleLoading ? "Opening Google…" : "Continue with Google"}
                      </Button>
                    </TabsContent>
                    <TabsContent value="signup">
                      <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-username">Username</Label>
                          <Input
                            id="signup-username"
                            type="text"
                            {...signUpForm.register("username")}
                            aria-invalid={!!signUpForm.formState.errors.username}
                            aria-describedby={
                              signUpForm.formState.errors.username ? signUpUsernameErrorId : undefined
                            }
                          />
                          {signUpForm.formState.errors.username && (
                            <p id={signUpUsernameErrorId} className="text-sm text-destructive" role="alert">
                              {signUpForm.formState.errors.username.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            autoComplete="email"
                            {...signUpForm.register("email")}
                            aria-invalid={!!signUpForm.formState.errors.email}
                            aria-describedby={
                              signUpForm.formState.errors.email ? signUpEmailErrorId : undefined
                            }
                          />
                          {signUpForm.formState.errors.email && (
                            <p id={signUpEmailErrorId} className="text-sm text-destructive" role="alert">
                              {signUpForm.formState.errors.email.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            autoComplete="new-password"
                            {...signUpForm.register("password")}
                            aria-invalid={!!signUpForm.formState.errors.password}
                            aria-describedby={
                              signUpForm.formState.errors.password ? signUpPasswordErrorId : undefined
                            }
                          />
                          {signUpForm.formState.errors.password && (
                            <p id={signUpPasswordErrorId} className="text-sm text-destructive" role="alert">
                              {signUpForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>
                        <Button type="submit" className="w-full" disabled={signUpForm.formState.isSubmitting}>
                          {signUpForm.formState.isSubmitting ? "Creating account..." : "Sign Up"}
                        </Button>
                      </form>
                      <div className="my-6 flex items-center gap-4">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={handleGoogleSignIn}
                      >
                        <Chrome className="h-4 w-4" />
                        Continue with Google
                      </Button>
                    </TabsContent>
                  </Tabs>
                )}

                {authView === "forgot" && (
                  <div className="space-y-6">
                    <div className="space-y-2 text-center">
                      <Heading as="h2" size="md" className="text-foreground">
                        Forgot password?
                      </Heading>
                      <Text variant="muted" className="text-sm">
                        We&apos;ll email you a link to choose a new password.
                      </Text>
                    </div>
                    <form onSubmit={resetRequestForm.handleSubmit(handleResetRequest)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          autoComplete="email"
                          {...resetRequestForm.register("email")}
                          aria-invalid={!!resetRequestForm.formState.errors.email}
                          aria-describedby={
                            resetRequestForm.formState.errors.email ? resetEmailErrorId : undefined
                          }
                        />
                        {resetRequestForm.formState.errors.email && (
                          <p id={resetEmailErrorId} className="text-sm text-destructive" role="alert">
                            {resetRequestForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={resetRequestForm.formState.isSubmitting}>
                        {resetRequestForm.formState.isSubmitting ? "Sending link…" : "Send reset link"}
                      </Button>
                    </form>
                    <Button type="button" variant="ghost" className="w-full" onClick={() => setAuthView("auth")}>
                      Back to sign in
                    </Button>
                  </div>
                )}

                {authView === "reset" && (
                  <div className="space-y-6">
                    <div className="space-y-2 text-center">
                      <Heading as="h2" size="md" className="text-foreground">
                        Choose a new password
                      </Heading>
                      <Text variant="muted" className="text-sm">
                        Set a new password to secure your account.
                      </Text>
                    </div>
                    {!session && (
                      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        This link has expired or is invalid. Please request a new password reset email.
                      </div>
                    )}
                    <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          autoComplete="new-password"
                          {...resetPasswordForm.register("newPassword")}
                          aria-invalid={!!resetPasswordForm.formState.errors.newPassword}
                          aria-describedby={
                            resetPasswordForm.formState.errors.newPassword ? newPasswordErrorId : undefined
                          }
                        />
                        {resetPasswordForm.formState.errors.newPassword && (
                          <p id={newPasswordErrorId} className="text-sm text-destructive" role="alert">
                            {resetPasswordForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">Confirm new password</Label>
                        <Input
                          id="confirm-new-password"
                          type="password"
                          autoComplete="new-password"
                          {...resetPasswordForm.register("confirmPassword")}
                          aria-invalid={!!resetPasswordForm.formState.errors.confirmPassword}
                          aria-describedby={
                            resetPasswordForm.formState.errors.confirmPassword ? confirmPasswordErrorId : undefined
                          }
                        />
                        {resetPasswordForm.formState.errors.confirmPassword && (
                          <p id={confirmPasswordErrorId} className="text-sm text-destructive" role="alert">
                            {resetPasswordForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={resetPasswordForm.formState.isSubmitting || !session}
                      >
                        {resetPasswordForm.formState.isSubmitting ? "Updating…" : "Update password"}
                      </Button>
                    </form>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setAuthView("auth");
                        navigate("/auth", { replace: true });
                      }}
                    >
                      Back to sign in
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Section>
      </PageContainer>
    </div>
  );
};

export default Auth;
