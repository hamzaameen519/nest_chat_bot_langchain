import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { openAI } from 'src/utils/constant/openAI.constants';
import { PromptTemplate } from '@langchain/core/prompts';
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { TEMPLATES } from 'src/utils/constant';
import { getFirestore } from 'firebase-admin/firestore';
import { cert, initializeApp, getApps } from 'firebase-admin/app';

@Injectable()
export class LangChainService {
  private model: ChatOpenAI;
  private firestore;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not set in environment variables');
    }

    this.model = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      temperature: +openAI.BASIC_CHAT_OPENAI_TEMPERATURE, // Ensure this is the correct type (number)
      modelName: openAI.GPT_3_5_TURBO_1106, // Ensure this is the model you want to use
    });

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }

    // Initialize Firestore after Firebase app initialization
    this.firestore = getFirestore();
  }
  // private firestore = getFirestore();

  async processMessage(input: string): Promise<string> {
    try {
      const businessData: any[] = await this.getAllBookings(); // Assuming this returns an array of bookings

      // Use the template
      const promptTemplateString = TEMPLATES.BASIC_CHAT_TEMPLATE.replace(
        '{input}',
        input,
      );

      // Check if businessData is an array and not empty
      let businessDataString = '';
      if (businessData && businessData.length > 0) {
        businessDataString = businessData
          .map(
            (booking) => `
            ID: ${booking.id},
            Name: ${booking.name},
            Model: ${booking.model},
            Price: ${booking.price},
            Color: ${booking.color}.
          `,
          )
          .join('\n'); // Join multiple bookings with a newline between them
      } else {
        businessDataString = 'No bookings found.';
      }

      // Create the complete formatted string to include business insights
      const formattedPromptString = `${promptTemplateString}. Insights:\n${businessDataString}`;

      // Create the prompt template
      const prompt = PromptTemplate.fromTemplate(formattedPromptString);

      // Initialize the output parser
      const outputParser = new HttpResponseOutputParser();

      // Create the processing chain
      const chain = prompt.pipe(this.model).pipe(outputParser);

      // Generate the response
      const response = await chain.invoke({ input });

      // Handle different types of responses
      let responseString: string;

      if (response instanceof Uint8Array) {
        responseString = new TextDecoder().decode(response);
      } else if (typeof response === 'string') {
        responseString = response;
      } else {
        // Handle other types or throw an error
        throw new Error('Unexpected response type');
      }

      // Process the response
      const formattedResponse = responseString.trim(); // Example: trim whitespace

      return formattedResponse;
    } catch (error) {
      console.error('Error in LangChain processing:', error);

      // Provide detailed error information
      throw new HttpException(
        `An error occurred while processing the question: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllBookings(): Promise<any[]> {
    try {
      // Fetch all documents from the 'Bookings' collection
      const querySnapshot = await this.firestore.collection('Bookings').get();

      // Check if any bookings were found
      if (querySnapshot.empty) {
        console.log('No bookings found.');
        return [];
      }

      // Process and return all booking documents
      const bookings = querySnapshot.docs.map((doc) => ({
        id: doc.id, // Add the document ID
        ...doc.data(), // Spread the document data
      }));

      return bookings;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw new Error('Unable to retrieve bookings.');
    }
  }
}
