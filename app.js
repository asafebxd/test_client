import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { startChatbot } from "./chatbot/chatbot.js";

const GOOGLE_API_KEY = process.env.API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("API_KEY: undefined");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function main() {
  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    startChatbot(genAI);
  } catch (error) {
    console.log("API Error: error");
    if (error.response && error.response.data) {
      console.error("Detalhes do erro:", error.response.data);
    } else if (error.message) {
      console.error("Mensagem de erro:", error.message);
    } else {
      console.error("Erro completo:", error);
    }
  } finally {
  }
}

main();
