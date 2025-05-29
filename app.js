import "dotenv/config";

import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import TwilioSDK from "twilio";

import { handleIncomingWhatsAppMessage } from "./chatbot/chatbot.js";

const GOOGLE_API_KEY = process.env.API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("API_KEY: undefined");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

if (!TWILIO_ACCOUNT_SID | !TWILIO_AUTH_TOKEN | !TWILIO_WHATSAPP_NUMBER) {
  console.log("Error: Enviroment variables undefined");
  console.log("Check your .env file");
  process.exit(1);
}

const twilioClient = new TwilioSDK(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para analisar requisição POST
app.use(express.urlencoded({ extended: true }));

//Webhook com WhatsApp

app.post("/webhook/whatsapp", async (req, res) => {
  console.log("REQUEST: ", req.body);

  const incomingMessage = req.body.Body;
  const senderPhoneNumber = req.body.From;

  if (!incomingMessage || !senderPhoneNumber) {
    console.log(`Message from ${senderPhoneNumber}: "${incomingMessage}"`);
    console.log("Error missing message or number on the request");
    return res.sendStatus(400);
  }
  try {
    //Processa a mensagem que o bot deve enviar
    const botResponse = await handleIncomingWhatsAppMessage(
      genAI,
      incomingMessage,
      senderPhoneNumber
    );

    await twilioClient.messages.create({
      body: botResponse,
      from: TWILIO_WHATSAPP_NUMBER,
      to: senderPhoneNumber,
    });

    console.log(`Response to ${senderPhoneNumber}: "${botResponse}`);
    res.sendStatus(200);
  } catch (error) {
    console.log("Error processing Whatsapp message: ", error);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Whatsapp webhook configured in: http://localhost:${PORT}/webhook/whatsapp`
  );
  console.log("Use ngrok to show public URL");
});
