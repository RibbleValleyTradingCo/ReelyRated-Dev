import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import Eyebrow from "@/components/typography/Eyebrow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PageContainer className="w-full px-4 sm:px-6 md:mx-auto md:max-w-5xl py-12 md:py-16">
        <div className="space-y-6 min-w-0">
          <Section>
            <div className="flex min-h-[70vh] items-center justify-center">
              <Card className="w-full max-w-2xl border-border/70">
                <div className="space-y-4 p-6 sm:p-8 text-center">
                  <Eyebrow className="text-muted-foreground">404</Eyebrow>
                  <Heading as="h2" size="lg" className="text-foreground">
                    Your page got away…
                  </Heading>
                  <Text variant="muted" className="text-sm">
                    We couldn&apos;t find that page. Use the links below to get back on track.
                  </Text>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 justify-center">
                    <Button asChild className="w-full min-h-[44px]">
                      <Link to="/">Go home</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full min-h-[44px]">
                      <Link to="/venues">Browse venues</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </Section>
        </div>
      </PageContainer>
    </div>
  );
};

export default NotFound;
