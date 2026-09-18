import { Html, Head, Body, Container, Heading, Text, Button, Section } from "@react-email/components";

interface AtsRecheckNudgeEmailProps {
  userName: string;
  resumeName: string;
  lastScore: number;
  resumeUrl: string;
}

export function AtsRecheckNudgeEmail({ userName, resumeName, lastScore, resumeUrl }: AtsRecheckNudgeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f6f6f6", padding: "24px" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "32px" }}>
          <Heading style={{ fontSize: "20px" }}>Time for a resume check-up</Heading>
          <Text>Hi {userName},</Text>
          <Text>
            It's been a week since your last ATS analysis on <strong>{resumeName}</strong> (last score:{" "}
            <strong>{lastScore}/100</strong>). Job descriptions change fast — re-run your analysis against a
            new posting to keep your resume sharp.
          </Text>
          <Section style={{ marginTop: "24px" }}>
            <Button
              href={resumeUrl}
              style={{
                backgroundColor: "#111827",
                color: "#ffffff",
                padding: "12px 20px",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              Re-run ATS Analysis
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AtsRecheckNudgeEmail;
