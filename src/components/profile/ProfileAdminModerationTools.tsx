import { Link } from "react-router-dom";

interface ProfileAdminModerationToolsProps {
  profileId: string | null;
}

const ProfileAdminModerationTools = ({ profileId }: ProfileAdminModerationToolsProps) => {
  return (
    <section className="relative -mt-8 space-y-3 rounded-3xl border border-border bg-card/90 p-4 shadow-card ring-1 ring-border/50 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Moderation tools</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/reports"
          className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card/80 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover focus-ring"
        >
          <span className="text-sm font-semibold text-foreground">Reports</span>
          <p className="text-sm text-muted-foreground">Review community reports and escalate actions quickly.</p>
        </Link>
        <Link
          to="/admin/audit-log"
          className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card/80 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover focus-ring"
        >
          <span className="text-sm font-semibold text-foreground">Audit log</span>
          <p className="text-sm text-muted-foreground">Trace recent moderation actions and account changes.</p>
        </Link>
        {profileId ? (
          <Link
            to={`/admin/users/${profileId}/moderation`}
            className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card/80 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover focus-ring"
          >
            <span className="text-sm font-semibold text-foreground">Profile moderation</span>
            <p className="text-sm text-muted-foreground">Manage reports, blocks, and safety actions for this account.</p>
          </Link>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Your staff account is focused on safety and moderation. Use these tools to keep the community healthy.
      </p>
    </section>
  );
};

export default ProfileAdminModerationTools;
