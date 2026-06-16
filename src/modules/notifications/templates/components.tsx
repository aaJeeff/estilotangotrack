import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const main = { backgroundColor: "#f1f5f9", fontFamily: "Arial, Helvetica, sans-serif" };
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "480px",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
};
const header = { backgroundColor: "#0f172a", padding: "24px" };
const brand = { color: "#ffffff", fontSize: "20px", fontWeight: 700, margin: 0 };
const tagline = { color: "#94a3b8", fontSize: "13px", margin: "4px 0 0" };
const content = { padding: "24px" };
const footer = { color: "#94a3b8", fontSize: "12px", padding: "0 24px 24px" };

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>Camisetas</Text>
            <Text style={tagline}>Seguimiento de pedidos</Text>
          </Section>
          <Section style={content}>{children}</Section>
          <Hr style={{ borderColor: "#e2e8f0", margin: "0 24px" }} />
          <Section>
            <Text style={footer}>
              Este es un mensaje automático. Si tenés dudas, escribinos por Instagram.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  heading: { color: "#0f172a", fontSize: "18px", fontWeight: 700, margin: "0 0 12px" },
  paragraph: { color: "#334155", fontSize: "14px", lineHeight: "22px", margin: "0 0 12px" },
  button: {
    display: "inline-block",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
    padding: "12px 20px",
    borderRadius: "10px",
  },
  muted: { color: "#64748b", fontSize: "13px", lineHeight: "20px", margin: "12px 0 0" },
};
