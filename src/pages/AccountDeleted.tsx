import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import Eyebrow from "@/components/typography/Eyebrow";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";

const AccountDeleted = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6 py-10">
        <Section>
          <div className="flex min-h-screen items-center justify-center">
            <Card className="w-full max-w-xl border-border/70">
              <CardHeader className="space-y-3 text-center">
                <Eyebrow className="text-muted-foreground">Account deleted</Eyebrow>
                <Heading as="h2" size="lg" className="text-foreground">
                  Your account has been deleted
                </Heading>
                <Text variant="muted" className="text-sm">
                  You have been logged out and your profile hidden. Some moderation history may be retained for safety.
                </Text>
                <Text variant="muted" className="text-sm">
                  You can&apos;t reuse this account or email address, but you can create a new account anytime.
                </Text>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                <Button asChild className="w-full min-h-[44px]">
                  <Link to="/">Back to home</Link>
                </Button>
                <Button asChild variant="outline" className="w-full min-h-[44px]">
                  <Link to="/auth">Create a new account</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Section>
      </PageContainer>
    </div>
  );
};

export default AccountDeleted;
