import PERSONA_PROMPT from "./persona.js";
import ALL_POSSIBLE_QUESTIONS from "./questions.js";

const userSessions = new Map(); // Key: senderPhoneNumber, Value: { history: [], clientData: { name: null, email: null, number: null } }

export async function handleIncomingWhatsAppMessage(
  genAi,
  incomingMessage,
  senderPhoneNumber
) {
  let session = userSessions.get(senderPhoneNumber);
  if (!session) {
    console.log(`[DEBUG] New session for user: ${senderPhoneNumber}`);
    session = {
      history: [],
      clientData: {
        name: null,
        email: null,
        number: null,
      },
    };
  }
  userSessions.set(senderPhoneNumber, session);

  //Contexto para IA
  session.history.push({
    role: "user",
    parts: [{ text: PERSONA_PROMPT + "\n\n" + ALL_POSSIBLE_QUESTIONS }],
  });

  session.history.push({
    role: "model",
    parts: [{ text: "Compreendido. Pronto para guiar o cliente " }],
  });

  session.history.push({
    role: "model",
    parts: [
      {
        text: "Olá! Seja muito bem-vindo(a) à Gioppo & Conti. Sou o Sr. Gioppo. Antes de começarmos, nos informe seu nome completo, email e telefone por favor!",
      },
    ],
  });

  session.history.push({
    role: "user",
    parts: [{ text: `Cliente: ${incomingMessage}` }],
  });

  console.log(`[DEBUG] History updated to user: ${senderPhoneNumber}`);

  if (!session.clientData.name) {
    const nameMatch = incomingMessage.match(
      /(?:meu nome é|chamo-me|sou|é)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+)/i
    );
    if (nameMatch && nameMatch[1]) {
      session.clientData.name = nameMatch[1].trim();
      console.log(`[DEBUG] Name extracted: ${session.clientData.name}`);
    } else {
      // Fallback simples se o nome não for pego pela regex na primeira tentativa
      const firstWord = incomingMessage.split(" ")[0];
      if (
        firstWord &&
        firstWord.length > 2 &&
        firstWord.toLowerCase() !== "olá"
      ) {
        session.clientData.name = firstWord.trim();
        console.log(
          `[DEBUG] Name presumed by word): ${session.clientData.name}`
        );
      }
    }
  }

  if (!session.clientData.email) {
    const emailMatch = incomingMessage.match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/i
    );
    if (emailMatch && emailMatch[1]) {
      session.clientData.email = emailMatch[1].trim();
      console.log(`[DEBUG] Email extraído: ${session.clientData.email}`);
    }
  }

  if (!session.clientData.number) {
    const numberMatch = incomingMessage.match(
      /(\(?\d{2}\)?\s?\d{4,5}-?\d{4}|\+\d{1,3}\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4})/
    );
    if (numberMatch && numberMatch[1]) {
      session.clientData.number = numberMatch[1].trim();
      console.log(`[DEBUG] Telefone extraído: ${session.clientData.number}`);
    }
  }

  let missingInfo = [];
  if (!session.clientData.name || session.clientData.name === "cliente")
    missingInfo.push("nome completo");
  if (!session.clientData.email) missingInfo.push("email");
  if (!session.clientData.number) missingInfo.push("telefone");

  let dynamicPromptAdditions = "";
  if (missingInfo.length > 0) {
    dynamicPromptAdditions = `
    **ATENÇÃO:** O cliente ainda não forneceu todas as informações de contato.
    Campos faltando: ${missingInfo.join(", ")}.
    Sua próxima resposta DEVE ser uma nova solicitação para o cliente fornecer essas informações faltantes.
    Não avance para outras perguntas até que todos os campos de NOME COMPLETO, EMAIL e TELEFONE estejam preenchidos.
    `;
  } else {
    dynamicPromptAdditions = `
    Todas as informações de contato iniciais (nome, email, telefone) foram coletadas.
    Agora, você deve determinar a próxima pergunta MAIS LÓGICA da lista de "PERGUNTAS E OPÇÕES DISPONÍVEIS" para fazer ao cliente, OU se a conversa deve ser FINALIZADA.
    Lembre-se de NÃO AVANÇAR PARA A PRÓXIMA PERGUNTA SEM QUE O CLIENTE ESCOLHA UMA DAS OPÇÕES DE PERGUNTA, se a pergunta atual tiver opções.
    `;
  }

  const chat = genAi
    .getGenerativeModel({ model: "gemini-1.5-flash" })
    .startChat({
      history: session.history,
      generationConfi: {
        maxOutputTokens: 200,
        temperature: 0.2,
      },
    });

  const promptForNextQuestion = `
    Com base na última resposta do cliente:
    "${session.history[session.history.length - 1].parts[0].text}"

    ${dynamicPromptAdditions}

    Sua resposta deve ser APENAS a pergunta formatada (incluindo as opções numeradas fornecidas 1., 2., 3., 4.) OU a mensagem FINALIZAR_CONVERSA:.

    Substitua '{{nome do cliente}}' pelo nome real do cliente (${
      session.clientData.name || "cliente"
    }).
  `;

  let aiResponseContent = "";
  try {
    const result = await chat.sendMessage(promptForNextQuestion);
    aiResponseContent = result.response.text().trim();
  } catch (error) {
    console.error("[ERRO IA] ao gerar a próxima pergunta:", error);
    aiResponseContent =
      "Desculpe, tive um problema ao gerar a próxima pergunta. Por favor, tente novamente mais tarde.";
  }

  // Adiciona a resposta da IA ao histórico deste usuário
  session.history.push({
    role: "model",
    parts: [{ text: aiResponseContent }],
  });
  console.log(
    `[DEBUG] Resposta da IA adicionada ao histórico de ${senderPhoneNumber}: ${aiResponseContent}`
  );

  // --- 3.6: Tratar a Finalização da Conversa ---
  if (aiResponseContent.startsWith("FINALIZAR_CONVERSA:")) {
    const finalMessage = aiResponseContent
      .replace("FINALIZAR_CONVERSA:", "")
      .trim();
    console.log(`[DEBUG] Conversa finalizada para ${senderPhoneNumber}.`);
    // Opcional: Limpar a sessão do usuário ou marcar como finalizada
    // userSessions.delete(senderPhoneNumber); // Se quiser que a conversa reinicie do zero
    return finalMessage; // Retorna a mensagem final para o app.js enviar
  }

  // --- 3.7: Retornar a Pergunta do Bot para o app.js Enviar ---
  let displayQuestion = aiResponseContent.replace(
    "{{nome do cliente}}",
    session.clientData.name || "cliente"
  );
  return displayQuestion; // Retorna a pergunta para o app.js enviar para o WhatsApp
}
