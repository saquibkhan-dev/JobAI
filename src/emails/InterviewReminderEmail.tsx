import { Html, Head, Body, Container, Heading, Text, Button, Section } from "@react-email/components";

interface InterviewReminderEmailProps {
  userName: string;
  companyName: string;
  jobTitle: string;
  interviewAt: string; // pre-formatted for the recipient's locale
  applicationUrl: string;
}

export function InterviewReminderEmail({
  userName,
  companyName,
  jobTitle,
  interviewAt,
  applicationUrl,
}: InterviewReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f6f6f6", padding: "24px" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "32px" }}>
          <Heading style={{ fontSize: "20px" }}>Upcoming interview reminder</Heading>
          <Text>Hi {userName},</Text>
          <Text>
            This is a reminder that your interview for <strong>{jobTitle}</strong> at{" "}
            <strong>{companyName}</strong> is coming up on <strong>{interviewAt}</strong>.
          </Text>
          <Text>Good luck — you've got this!</Text>
          <Section style={{ marginTop: "24px" }}>
            <Button
              href={applicationUrl}
              style={{
                backgroundColor: "#111827",
                color: "#ffffff",
                padding: "12px 20px",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              View application
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default InterviewReminderEmail;
