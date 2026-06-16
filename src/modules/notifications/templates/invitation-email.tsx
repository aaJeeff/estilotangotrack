import { Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles } from "./components";

export interface InvitationEmailProps {
  fullName: string;
  actionLink: string;
}

export function InvitationEmail({ fullName, actionLink }: InvitationEmailProps) {
  return (
    <EmailLayout preview="Te invitamos a seguir tu pedido">
      <Text style={emailStyles.heading}>¡Hola {fullName}!</Text>
      <Text style={emailStyles.paragraph}>
        Creamos tu cuenta para que puedas seguir el avance de tu pedido de camisetas en
        tiempo real: desde que sale de China hasta que llega a tus manos.
      </Text>
      <Text style={emailStyles.paragraph}>
        Para empezar, definí tu contraseña haciendo clic en el botón:
      </Text>
      <Section style={{ margin: "8px 0 4px" }}>
        <a href={actionLink} style={emailStyles.button}>
          Definir mi contraseña
        </a>
      </Section>
      <Text style={emailStyles.muted}>
        Si el botón no funciona, copiá y pegá este enlace en tu navegador:
        <br />
        {actionLink}
      </Text>
    </EmailLayout>
  );
}

export default InvitationEmail;
