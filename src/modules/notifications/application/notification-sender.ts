// Port for outbound notifications. Today: email (Resend). Tomorrow: WhatsApp.
// The domain/services depend on this interface, not on Resend.

export interface InvitationMessage {
  to: string;
  fullName: string;
  actionLink: string;
}

export interface StatusUpdateMessage {
  to: string;
  fullName: string;
  orderNumber: string;
  statusLabel: string;
  helpText: string;
  trackingUrl: string;
}

export interface SendResult {
  providerId: string | null;
}

export interface NotificationSender {
  sendInvitation(msg: InvitationMessage): Promise<SendResult>;
  sendStatusUpdate(msg: StatusUpdateMessage): Promise<SendResult>;
}
