import readline from "readline";
import PERSONA_PROMPT from "./persona.js";
import ALL_POSSILBE_QUESTIONS from "./questions.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export async function startChatbot(genAI) {
  // Mensagem de start da conversa
  console.log("Iniciando o atendimento com o Sr. Gioppo...");
  let conversationHistory = [];

  // Bloco de primeira interação e Coleta de Dados Básicos
  let currentQuesition =
    "Olá! Seja Muito bem vindo(a) à Gioppo & Conti. Antes de começarmos, nos informe seu nome completo, email e telefone por favor!";
  console.log(`\n${currentQuesition}`);
  //Obtenha resposta do cliente
  let clientInfo = await new Promise((resolve) => {
    rl.question("Sua resposta: ", resolve);
  });
  //Adiciona resposta do cliente ao historico
  conversationHistory.push({
    role: "user",
    parts: [{ text: `Cliente: ${clientInfo}` }],
  });

  let clientName = "cliente";
  let clientEmail = "email";
  let clientNumber = null;

  // --Bloco 2: Loop principal da conversa (AI Control)
  while (true) {
    const chat = genAI
      .getGenerativeModel({ model: "gemini-1.5-flash" })
      .startChat({
        history: [
          {
            role: "user",
            parts: [{ text: PERSONA_PROMPT + "\n\n" + ALL_POSSILBE_QUESTIONS }], // Contexto da conversa + Persona
          },
          {
            role: "model",
            parts: [
              { text: "Compreendido. Estou pronto para guiar o cliente." },
            ],
          }, // Confirmação da IA
          ...conversationHistory, // Adiciona historico da conversa
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.2,
        },
      });

    //Instrução para IA analisar a ultima resposta e decidir a próxima ação
    const promptForNextQuestion = `
        Com base na última resposta do cliente 
                "${
                  conversationHistory[conversationHistory.length - 1].parts[0]
                    .text
                }"
                Faça a próxima pergunta pergunta da fila dentro da lista de "PERGUNTAS E AÇÕES DISPONIVEIS" ou se a conversa deve ser FINALIZADA

                Sua resposta deve ser APENAS a pergunta formatada (incluindo as opções numeradas fornecedias 1., 2., 3., 4.) ou mensagem de FINALIZAR CONVERSA

                Se o cliente ainda não tiver fornecido todos os campos de NOME COMPLETO, EMAIL OU TELEFONE refaça a pergunta inicial pedindo as informações que faltam
                
                Após receber as informações de nome, email e telefone, NÃO repita a pergunta sobre essas informções

                Caso o cliente seleciona uma opção não existente, reforce que ele escolha uma das opções

                TAMBEM NÃO AVANCE PARA A PROXIMA PERGUNTA SEM QUE O CLIENTE ESCOLHA UMA DAS OPÇOES DE PERGUNTA

                Substitua '{{Cliente}}' pelo nome do cliente.
      `;
    let aiResponseContent = "";
    try {
      // Envio da mensagem para a IA e Recebimento da resposta
      const result = await chat.sendMessage(promptForNextQuestion);
      aiResponseContent = result.response.text().trim();
    } catch (error) {
      console.log("Error to generenate next question ", error);
      aiResponseContent =
        "Desculpe, tive um problema ao gerar a proxima pergunta. Por favor, tente novamente mais tarde";
    }

    //Atualização do historico da conversa;
    conversationHistory.push({
      role: "model",
      parts: [{ text: aiResponseContent }],
    });

    if (
      aiResponseContent.startsWith(
        "FINALIZAR_CONVERSA:" ||
          "FINALIZAR_CONVERSA_CONSULTORES:" ||
          "FINALIZAR_CONVERSA_OUTRAS_CIDADANIAS:"
      )
    ) {
      console.log(
        `\n${aiResponseContent.replace("FINALIZAR_CONVERSA: ", "").trim()}`
      );
      break;
    }
    let displayQuestion = aiResponseContent.replace(
      // Substitui o placeholder de nome
      "{{nome do cliente}}",
      clientName
    );
    console.log(`\n${displayQuestion}`);

    let clientAnswer = await new Promise((resolve) => {
      rl.question("Sua resposta: ", resolve);
    });
    conversationHistory.push({
      role: "user",
      parts: [{ text: `Cliente ${clientAnswer}` }],
    });

    //Logica de extração de nome do cliente
    if (conversationHistory.length === 2 && clientName === "cliente") {
      const nameMatch = clientInfo.match(
        /(?:meu nome é|chamo-me|sou)\s+([A-Za-z\s]+)/i
      );
      if (nameMatch && nameMatch[i]) {
        clientName = nameMatch[1].trim();
        console.log(`Email: ${clientName}`);
      }
    }

    //Logica de extração de email do cliente
    if (clientEmail === null || clientEmail === "email" || clientEmail === "") {
      const emailMatch = clientInfo.match(
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
      );
      if (emailMatch && emailMatch[i]) {
        clientEmail = emailMatch[1].trim();
        console.log(`Email: ${clientEmail}`);
      }
    }

    //Logica de extração de numero do cliente
    if (
      clientNumber === null ||
      clientNumber === "numero" ||
      clientNumber === ""
    ) {
      const numberMatch = clientInfo.match(
        /(\(?\d{2}\)?\s?\d{4,5}-?\d{4}|\+\d{2}\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4})/
      );
      if (numberMatch && numberMatch[i]) {
        clientNumber = numberMatch[1].trim();
        console.log(`Number: ${clientNumber}`);
      }
    }
  } // Fim do while true

  // ---Bloco de finalização de conversa---
  rl.close();
  console.log("\nAtendimento finalizado Obrigado!");
  console.log("\n-------- chat history --------");
  conversationHistory.forEach((msg) => {
    console.log(
      `${msg.role === "user" ? "CLIENTE" : "SR. GIOPPO"}: ${msg.parts[0].text}`
    );
  });
}
