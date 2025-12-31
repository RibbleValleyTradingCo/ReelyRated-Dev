import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/layout/PageContainer";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";

const AccountDeleted = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6">
        <main className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-xl rounded-xl border border-border/70 bg-card p-8 shadow-card">
            <div className="space-y-3 text-center">
              <Heading as="h1" size="lg" className="text-foreground">
                ACCOUNT DELETED
              </Heading>
              <Text variant="muted" className="text-sm">
                Your account has been deleted, and we&apos;re sorry to see you go.
              </Text>
              <Text variant="muted" className="text-sm">
                You have been logged out and your profile is now hidden. For safety, limited moderation history (such as
                violation logs) may be retained.
              </Text>
              <Text variant="muted" className="text-sm">
                You cannot reuse the deleted account or email address, but you can create a new account at any time.
              </Text>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              <Button asChild className="w-full min-h-[44px]">
                <Link to="/">Back to home</Link>
              </Button>
              <Button asChild variant="outline" className="w-full min-h-[44px]">
                <Link to="/auth">Create a new account</Link>
              </Button>
            </div>
          </div>
        </main>
      </PageContainer>
    </div>
  );
};

export default AccountDeleted;
