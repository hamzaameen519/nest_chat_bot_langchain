import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { LangChainService } from './langchain/langchain.service';
import { ChatbotController } from './chatbot/chatbot.controller';

@Module({
  imports: [],
  controllers: [AppController, ChatbotController],
  providers: [AppService, WhatsappService, LangChainService],
})
export class AppModule {}
