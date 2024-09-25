import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { LangChainService } from 'src/langchain/langchain.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';

@Controller('chatbot')
export class ChatbotController {
  // private twilioSignature: string;
  private twilioSignature = process.env.TWILIO_AUTH_TOKEN;

  constructor(
    private readonly langChainService: LangChainService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async handleMessageLangChain(to: string, message: string) {
    const processedMessage =
      await this.langChainService.processMessage(message);
    await this.whatsappService.sendWhatsappMessage(to, processedMessage);
  }

  @Post('send/message')
  async handleMessage(@Body() body: { to: string; message: string }) {
    const { to, message } = body;
    await this.handleMessageLangChain(to, message);
    return { success: true };
  }

  @Post('receive/message')
  async handleIncomingMessage(@Req() req: Request, @Res() res: Response) {
    const { Body, From } = req.body;

    console.log(`Message from ${From}: ${Body}`);
    const split = From.split(':');
    await this.handleMessageLangChain(split[1], Body);

    res.status(200).send('chatbot message successfuly delivered');
  }
}
