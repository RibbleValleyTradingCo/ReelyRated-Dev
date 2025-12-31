import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProfileSettingsIdentityHeader from "@/components/settings/ProfileSettingsIdentityHeader";
import ProfileSettingsAccountCard from "@/components/settings/ProfileSettingsAccountCard";
import ProfileSettingsEmailChangeCard from "@/components/settings/ProfileSettingsEmailChangeCard";
import ProfileSettingsPasswordCard from "@/components/settings/ProfileSettingsPasswordCard";
import ProfileSettingsDataExportCard from "@/components/settings/ProfileSettingsDataExportCard";
import ProfileSettingsDeleteAccountCard from "@/components/settings/ProfileSettingsDeleteAccountCard";
import ProfileSettingsPrivacyCard from "@/components/settings/ProfileSettingsPrivacyCard";
import ProfileSettingsSafetyBlockingCard, {
  BlockedProfileEntry,
} from "@/components/settings/ProfileSettingsSafetyBlockingCard";
import ProfileSettingsNav, { SectionId } from "@/components/settings/ProfileSettingsNav";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Text from "@/components/typography/Text";
import Heading from "@/components/typography/Heading";
import { isAdminUser } from "@/lib/admin";
import { Ban, Download, Loader2, Lock, Mail, Shield, Trash2, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { profileSchema, passwordChangeSchema, type ProfileFormData, type PasswordChangeFormData } from "@/schemas";
import PageSkeleton from "@/components/ui/PageSkeleton";
import SectionSkeleton from "@/components/ui/SectionSkeleton";

const SettingsSectionHeader = ({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}) => {
  return (
    <div className="space-y-1">
      <Heading as="h3" size="sm" className="text-foreground">
        <span className="inline-flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
          {title}
        </span>
      </Heading>
      {subtitle ? (
        <Text variant="muted" className="text-sm text-muted-foreground">
          {subtitle}
        </Text>
      ) : null}
    </div>
  );
};

const ProfileSettings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Profile Form with Zod validation
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      bio: "",
    },
  });

  // Password Change Form with Zod validation
  const passwordForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const emailForm = useForm<{ newEmail: string; confirmEmail: string }>({
    defaultValues: {
      newEmail: "",
      confirmEmail: "",
    },
  });

  const [initialEmail, setInitialEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [initialAvatarPath, setInitialAvatarPath] = useState<string | null>(null);
  const [legacyAvatarUrl, setLegacyAvatarUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [blockedProfiles, setBlockedProfiles] = useState<BlockedProfileEntry[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [isAdmin, setIsAdmin] = useState(false);
  const profileSectionRef = useRef<HTMLDivElement | null>(null);
  const securitySectionRef = useRef<HTMLDivElement | null>(null);
  const dataPrivacySectionRef = useRef<HTMLDivElement | null>(null);
  const safetyBlockingSectionRef = useRef<HTMLDivElement | null>(null);
  const dataSectionRef = useRef<HTMLDivElement | null>(null);
  const dangerZoneSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    let active = true;
    const checkAdmin = async () => {
      if (!user?.id) {
        if (active) setIsAdmin(false);
        return;
      }
      const result = await isAdminUser(user.id);
      if (active) setIsAdmin(result);
    };
    void checkAdmin();
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setIsLoading(true);

      const [{ data: profileData, error: profileError }, { data: authData, error: authError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("username, full_name, avatar_path, avatar_url, bio, is_private")
            .eq("id", user.id)
            .maybeSingle(),
          supabase.auth.getUser(),
        ]);

      if (profileError || authError) {
        console.error("Failed to load profile settings", profileError ?? authError);
        toast.error("Unable to load profile settings.");
        setIsLoading(false);
        return;
      }

      const email = authData?.user?.email ?? "";
      setInitialEmail(email);

      const nextForm = {
        username: profileData?.username ?? user.user_metadata?.username ?? "",
        fullName: profileData?.full_name ?? user.user_metadata?.full_name ?? "",
        email,
        bio: profileData?.bio ?? user.user_metadata?.bio ?? "",
      };

      const storedPath = profileData?.avatar_path ?? null;
      const legacyUrl = profileData?.avatar_url ?? user.user_metadata?.avatar_url ?? null;

      profileForm.reset(nextForm);
      setAvatarPath(storedPath);
      setInitialAvatarPath(storedPath);
      setLegacyAvatarUrl(legacyUrl);
      setIsPrivate(profileData?.is_private ?? false);
      setIsLoading(false);
    };

    if (user) {
      void loadProfile();
    }
  }, [profileForm, user]);

  const handleSaveProfile = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      const updates = {
        username: data.username.trim(),
        full_name: data.fullName.trim() || null,
        avatar_path: avatarPath,
        bio: data.bio.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (updateProfileError) {
        throw updateProfileError;
      }

      setInitialAvatarPath(avatarPath ?? null);
      toast.success("Profile details saved successfully.");

      // Reset form to new values to clear dirty state
      profileForm.reset(data);
    } catch (error) {
      console.error("Failed to save profile", error);
      toast.error(error instanceof Error ? error.message : "Unable to save profile changes.");
    }
  };

  const handleUpdatePassword = async (data: PasswordChangeFormData) => {
    if (!user) return;

    try {
      const emailForAuth = initialEmail;
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: emailForAuth,
        password: data.currentPassword,
      });

      if (reauthError) {
        throw new Error("Current password is incorrect.");
      }

      const { error: passwordUpdateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (passwordUpdateError) {
        throw passwordUpdateError;
      }

      toast.success("Password updated successfully.");
      passwordForm.reset();
    } catch (error) {
      console.error("Failed to update password", error);
      toast.error(error instanceof Error ? error.message : "Unable to update password.");
    }
  };

  const handleEmailChange = async ({ newEmail, confirmEmail }: { newEmail: string; confirmEmail: string }) => {
    if (!user) return;

    const trimmedNewEmail = newEmail.trim();
    const trimmedConfirmEmail = confirmEmail.trim();

    if (!trimmedNewEmail) {
      toast.error("Please enter a new email address.");
      return;
    }

    if (trimmedNewEmail !== trimmedConfirmEmail) {
      toast.error("Email addresses do not match.");
      return;
    }

    if (trimmedNewEmail.toLowerCase() === initialEmail.toLowerCase()) {
      toast.error("That’s already your current email.");
      return;
    }

    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth?fromEmailChange=true` : undefined;
      const { error } = await supabase.auth.updateUser(
        { email: trimmedNewEmail },
        redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      );

      if (error) {
        throw error;
      }

      toast.success("Check your inbox to confirm the new email address.");
      emailForm.reset();
    } catch (error) {
      console.error("Failed to change email", error);
      toast.error(error instanceof Error ? error.message : "Unable to change email.");
    }
  };

  const handleDownloadExport = async () => {
    try {
      setIsExporting(true);
      const { data, error } = await supabase.rpc("request_account_export");

      if (error) {
        console.error(error);
        toast.error("Unable to generate data export");
        return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `reelyrated-export-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Data export downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong creating your export");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrivacyToggle = async (nextValue: boolean) => {
    if (!user) return;
    try {
      setIsUpdatingPrivacy(true);
      const { error } = await supabase
        .from("profiles")
        .update({ is_private: nextValue })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setIsPrivate(nextValue);
      toast.success(nextValue ? "Your account is now private." : "Your account is now public.");
    } catch (error) {
      console.error("Failed to update privacy", error);
      toast.error("Unable to update profile privacy right now.");
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!user) {
      toast.error("You need to be signed in to delete your account.");
      return;
    }
    try {
      setIsDeletingAccount(true);
      const { error } = await supabase.rpc("request_account_deletion", {
        p_reason: deleteReason.trim() || null,
      });

      if (error) {
        console.error("Failed to delete account", error);
        toast.error("We couldn't delete your account right now. Please try again in a moment.");
        return;
      }

      toast.success("Your account has been deleted.");
      const { error: signOutError } = await signOut();
      if (signOutError) {
        toast.error("Account deleted, but sign out failed. Please refresh and sign in again.");
        return;
      }
      navigate("/account-deleted");
    } catch (error) {
      console.error("Error deleting account", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleUnblock = async (blockedId: string, username?: string | null) => {
    try {
      const { error } = await supabase.rpc("unblock_profile", {
        p_blocked_id: blockedId,
      });
      if (error) {
        throw error;
      }
      toast.success(username ? `You’ve unblocked @${username}.` : "User unblocked.");
      setBlockedProfiles((prev) => prev.filter((entry) => entry.blocked_id !== blockedId));
      void fetchBlockedProfiles();
    } catch (error) {
      console.error("Failed to unblock user", error);
      toast.error("We couldn’t unblock this user. Please try again.");
    }
  };

  const fetchBlockedProfiles = useCallback(async () => {
    if (!user) {
      setBlockedProfiles([]);
      return;
    }
    try {
      setBlockedLoading(true);
      setBlockedError(null);
      const { data, error } = await supabase
        .from("profile_blocks")
        .select("blocked_id, profiles:blocked_id (id, username, full_name, avatar_path, avatar_url, bio, is_deleted)")
        .eq("blocker_id", user.id);
      if (error) {
        throw error;
      }
      type BlockedProfileRow = {
        blocked_id: string;
        profiles: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_path: string | null;
          avatar_url: string | null;
          bio: string | null;
          is_deleted: boolean;
        } | null;
      };
      const rows = (data ?? []) as unknown as BlockedProfileRow[];
      setBlockedProfiles(
        rows.map((row) => ({
          blocked_id: row.blocked_id,
          profiles: row.profiles,
        }))
      );
    } catch (error) {
      console.error("Failed to load blocked anglers", error);
      setBlockedError("Unable to load blocked anglers right now.");
    } finally {
      setBlockedLoading(false);
    }
  }, [user]);

  const handleNavSelect = (id: SectionId) => {
    const sectionRefMap: Record<SectionId, RefObject<HTMLDivElement>> = {
      "profile": profileSectionRef,
      "security": securitySectionRef,
      "data-privacy": dataPrivacySectionRef,
      "safety-blocking": safetyBlockingSectionRef,
      "data": dataSectionRef,
      "danger-zone": dangerZoneSectionRef,
    };
    const target = sectionRefMap[id].current;
    if (target) {
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setActiveSection(id);
  };

  useEffect(() => {
    void fetchBlockedProfiles();
  }, [fetchBlockedProfiles]);

  useEffect(() => {
    const sections: { id: SectionId; ref: RefObject<HTMLDivElement> }[] = [
      { id: "profile", ref: profileSectionRef },
      { id: "security", ref: securitySectionRef },
      { id: "data-privacy", ref: dataPrivacySectionRef },
      { id: "safety-blocking", ref: safetyBlockingSectionRef },
      { id: "data", ref: dataSectionRef },
      { id: "danger-zone", ref: dangerZoneSectionRef },
    ];

    const handleScroll = () => {
      const offset = 140;
      let current: SectionId = "profile";
      sections.forEach((section) => {
        const el = section.ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top - offset <= 0) {
          current = section.id;
        }
      });
      setActiveSection((prev) => (prev === current ? prev : current));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageContainer className="py-10 md:py-12">
          <PageSkeleton sections={4} />
        </PageContainer>
      </div>
    );
  }

  const navSections = [
    { id: "profile" as const, label: "Profile details", active: activeSection === "profile" },
    { id: "security" as const, label: "Account", active: activeSection === "security" },
    { id: "data-privacy" as const, label: "Privacy", active: activeSection === "data-privacy" },
    { id: "safety-blocking" as const, label: "Safety & blocking", active: activeSection === "safety-blocking" },
    { id: "data" as const, label: "Data", active: activeSection === "data" },
    { id: "danger-zone" as const, label: "Account deletion", active: activeSection === "danger-zone" },
  ];
  const watchedUsername = profileForm.watch("username");
  const watchedFullName = profileForm.watch("fullName");
  const watchedBio = profileForm.watch("bio");
  const identityUsername =
    watchedUsername?.trim() || user?.user_metadata?.username || user?.email || "Angler";
  const identityFullName =
    watchedFullName?.trim() || user?.user_metadata?.full_name || null;
  const identityBio = watchedBio ?? "";

  const handleEditBio = () => {
    setActiveSection("profile");
    const bioElement = document.getElementById("bio") as HTMLTextAreaElement | null;
    if (!bioElement) {
      handleNavSelect("profile");
      return;
    }
    bioElement.scrollIntoView({ behavior: "smooth", block: "start" });
    bioElement.focus({ preventScroll: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageContainer className="py-8 md:py-12">
        <div className="space-y-8 md:space-y-10">
          <Section>
            <SectionHeader
              title="Profile settings"
              subtitle="Manage your account, avatar and security."
              actions={isAdmin ? <Badge variant="secondary">Admin</Badge> : null}
            />
          </Section>

          <div className="space-y-6">
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <ProfileSettingsNav
                    sections={navSections}
                    onSelect={handleNavSelect}
                    variant="rail"
                  />
                </div>
              </aside>

              <div className="min-w-0 space-y-8">
                <Section>
                  <div ref={profileSectionRef} id="profile" className="space-y-4 scroll-mt-28">
                    <SettingsSectionHeader title="Profile details" icon={User} />
                    <div className="space-y-6">
                      {user ? (
                        <ProfileSettingsIdentityHeader
                          userId={user.id}
                          username={identityUsername}
                          fullName={identityFullName}
                          bio={identityBio}
                          avatarPath={avatarPath}
                          legacyAvatarUrl={legacyAvatarUrl}
                          onAvatarChange={(path) => {
                            setAvatarPath(path);
                            if (path) {
                              setLegacyAvatarUrl(null);
                            }
                          }}
                          onEditBio={handleEditBio}
                        />
                      ) : null}

                      <div className="lg:hidden">
                        <ProfileSettingsNav sections={navSections} onSelect={handleNavSelect} />
                      </div>

                      <form className="space-y-8" onSubmit={profileForm.handleSubmit(handleSaveProfile)}>
                        <ProfileSettingsAccountCard profileForm={profileForm} />

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={profileForm.formState.isSubmitting || (!profileForm.formState.isDirty && avatarPath === initialAvatarPath)}
                            className="h-11 w-full md:w-auto"
                          >
                            {profileForm.formState.isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving…
                              </>
                            ) : (
                              "Save changes"
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </Section>

                <Section>
                  <div ref={securitySectionRef} id="security" className="space-y-4 scroll-mt-28">
                    <SettingsSectionHeader title="Account" icon={Mail} />
                    <div className="space-y-6">
                      <ProfileSettingsEmailChangeCard
                        initialEmail={initialEmail}
                        emailForm={emailForm}
                        onSubmit={handleEmailChange}
                      />
                      <hr className="border-border/80" />
                      <SettingsSectionHeader title="Security" icon={Lock} />
                      <ProfileSettingsPasswordCard passwordForm={passwordForm} onSubmit={handleUpdatePassword} />
                    </div>
                  </div>
                </Section>

                <hr className="border-border/80" />

                <Section>
                  <div ref={dataPrivacySectionRef} id="data-privacy" className="space-y-4 scroll-mt-28">
                    <SettingsSectionHeader title="Privacy" icon={Shield} />
                    <div className="space-y-6">
                      <ProfileSettingsPrivacyCard
                        isPrivate={isPrivate}
                        isUpdatingPrivacy={isUpdatingPrivacy}
                        onTogglePrivacy={(checked) => {
                          void handlePrivacyToggle(checked);
                        }}
                      />
                    </div>
                  </div>
                </Section>

                <hr className="border-border/80" />

                <Section>
                  <div ref={safetyBlockingSectionRef} id="safety-blocking" className="space-y-4 scroll-mt-28">
                    <SettingsSectionHeader title="Safety & blocking" icon={Ban} />
                    <div className="space-y-6">
                      {blockedLoading ? (
                        <SectionSkeleton lines={3} />
                      ) : (
                        <ProfileSettingsSafetyBlockingCard
                          blockedProfiles={blockedProfiles}
                          blockedLoading={blockedLoading}
                          blockedError={blockedError}
                          onUnblock={(blockedId, username) => {
                            void handleUnblock(blockedId, username);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </Section>

                <hr className="border-border/80" />

                <Section>
                  <div ref={dataSectionRef} id="data" className="space-y-4 scroll-mt-28">
                    <SettingsSectionHeader title="Data" icon={Download} />
                    <div className="space-y-6">
                      <ProfileSettingsDataExportCard isExporting={isExporting} onDownload={handleDownloadExport} />
                    </div>
                  </div>
                </Section>

                <Section>
                  <div ref={dangerZoneSectionRef} id="danger-zone" className="space-y-4 scroll-mt-28">
                    <SettingsSectionHeader title="Account deletion" icon={Trash2} />
                    <div className="space-y-6">
                      <ProfileSettingsDeleteAccountCard
                        isDeleteDialogOpen={isDeleteDialogOpen}
                        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                        deleteReason={deleteReason}
                        setDeleteReason={setDeleteReason}
                        isDeletingAccount={isDeletingAccount}
                        onDeleteAccount={handleAccountDeletion}
                      />
                    </div>
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default ProfileSettings;
