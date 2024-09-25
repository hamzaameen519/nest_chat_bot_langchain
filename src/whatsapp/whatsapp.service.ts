import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class WhatsappService {
  private client: Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID; // Get from environment variables
    const authToken = process.env.TWILIO_AUTH_TOKEN;   // Get from environment variables
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are missing');
    }
    this.client = new Twilio(accountSid, authToken);
  }

  // Send WhatsApp message
  async sendWhatsappMessage(to: string, message: string): Promise<any> {
    try {
      const response = await this.client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_FROM}`, // Twilio's WhatsApp Sandbox Number or your Twilio WhatsApp number
        to: `whatsapp:${to}`, // The recipient's WhatsApp number with country code (e.g., +1234567890)
      });
      return response;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }
}
