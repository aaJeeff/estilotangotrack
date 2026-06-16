import { Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./components";

export interface StatusUpdateEmailProps {
  fullName: string;
  orderNumber: string;
  statusLabel: string;
  helpText: string;
  trackingUrl: string;
}

export function StatusUpdateEmail({
  fullName,
  orderNumber,
  statusLabel,
  helpText,
  trackingUrl,
}: StatusUpdateEmailProps) {
  return (
    <EmailLayout preview={`Tu pedido ${orderNumber}: ${statusLabel}`}>
      <Text style={emailStyles.heading}>{statusLabel}</Text>
      <Text style={emailStyles.paragraph}>
        ¡Hola {fullName}! Tu pedido <strong>{orderNumber}</strong> tiene una novedad:
      </Text>
      <Text style={emailStyles.paragraph}>{helpText}</Text>
      <Section style={{ margin: "8px 0 4px" }}>
        <a href={trackingUrl} style={emailStyles.button}>
          Ver el seguimiento
        </a>
      </Section>
    </EmailLayout>
  );
}

export default StatusUpdateEmail;
