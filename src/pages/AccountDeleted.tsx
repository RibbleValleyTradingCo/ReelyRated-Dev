import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AccountDeleted = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
            <CardTitle className="text-2xl font-bold text-slate-900">Your account has been deleted</CardTitle>
            <p className="text-sm text-slate-600">
              You have been logged out. Your profile and catches have been anonymised/hidden, while some moderation history
              may be retained for safety. You’re welcome to sign up again with a new account any time.
            </p>
            <p className="text-sm text-slate-600">
              This account has been deleted. You can’t reuse this account or email address.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="ocean" className="h-11 rounded-full px-6">
              <Link to="/">Back to home</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-full px-6">
              <Link to="/auth">Create a new account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountDeleted;
