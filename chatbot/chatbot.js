import readline from "readline";
import PERSONA_PROMPT from "./persona.js";
import ALL_POSSIBLE_QUESTIONS from "./questions.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export async function startChatbot(genAI) {
  console.log("Iniciando o atendimento com o Sr. Gioppo...");
  let conversationHistory = []; // Historico de conversa

  // Conversa inicial
  let currentQuestion =
    "Olá! Seja muito bem-vindo(a) à Gioppo & Conti. Sou o Sr. Gioppo. Antes de começarmos, qual é seu nome completo, email e telefone?";
  console.log(`\n${currentQuestion}`);
  let clientInfo = await new Promise((resolve) => {
    rl.question("Sua resposta: ", resolve);
  });
  conversationHistory.push({
    role: "user",
    parts: [{ text: `Cliente: ${clientInfo}` }],
  });

  let clientName = "cliente";

  // Loop da conversa
  while (true) {
    // A cada iteração, passamos todo o histórico da conversa e as possíveis perguntas para a IA
    // A IA precisa decidir qual pergunta fazer em seguida
    const chat = genAI
      .getGenerativeModel({ model: "gemini-1.5-flash" })
      .startChat({
        history: [
          {
            role: "user",
            parts: [{ text: PERSONA_PROMPT + "\n\n" + ALL_POSSIBLE_QUESTIONS }],
          },
          {
            role: "model",
            parts: [
              { text: "Compreendido. Estou pronto para guiar o cliente." },
            ],
          }, // Confirmação da IA
          ...conversationHistory, // Adiciona o histórico da conversa
        ],
        generationConfig: {
          maxOutputTokens: 200, // Ajustar conforme a necessidade da resposta da IA
          temperature: 0.2, // Manter baixo para respostas mais focadas
        },
      });

    // A última mensagem do usuário (ou a informação inicial) será o prompt para a próxima pergunta
    // Aqui a IA deve processar a última resposta e gerar a PRÓXIMA PERGUNTA ou A MENSAGEM FINAL
    const promptForNextQuestion = `
        Com base na última resposta do cliente (se houver, ou na informação inicial):
        "${conversationHistory[conversationHistory.length - 1].parts[0].text}"

        Determine a próxima pergunta MAIS LÓGICA da lista de "PERGUNTAS E OPÇÕES DISPONÍVEIS" para fazer ao cliente, OU se a conversa deve ser FINALIZADA.

        Sua resposta deve ser APENAS a pergunta formatada (incluindo opções numeradas 1., 2., 3., 4.) OU a mensagem FINALIZAR_CONVERSA:.

        Se você precisar de uma informação que não está nas perguntas mas é essencial (como extrair o nome da primeira resposta), solicite-a diretamente.
        Substitua '{{nome do cliente}}' pelo nome real do cliente.
        `;

    let aiResponseContent = "";
    try {
      const result = await chat.sendMessage(promptForNextQuestion);
      aiResponseContent = result.response.text().trim();
    } catch (error) {
      console.error("Erro ao gerar próxima pergunta pela IA:", error);
      aiResponseContent =
        "Desculpe, tive um problema e não consigo gerar a próxima pergunta. Por favor, tente novamente mais tarde.";
    }

    // Adiciona a resposta da IA ao histórico
    conversationHistory.push({
      role: "model",
      parts: [{ text: aiResponseContent }],
    });

    // Verifica se a IA decidiu finalizar a conversa
    if (aiResponseContent.startsWith("FINALIZAR_CONVERSA:")) {
      console.log(
        `\n${aiResponseContent.replace("FINALIZAR_CONVERSA:", "").trim()}`
      );
      break; // Sai do loop
    }

    // Exibe a próxima pergunta gerada pela IA
    let displayQuestion = aiResponseContent.replace(
      "{{nome do cliente}}",
      clientName
    );
    console.log(`\n${displayQuestion}`);

    // Captura a próxima resposta do cliente
    let clientAnswer = await new Promise((resolve) => {
      rl.question("Sua resposta: ", resolve);
    });
    conversationHistory.push({
      role: "user",
      parts: [{ text: `Cliente: ${clientAnswer}` }],
    });

    // Tente extrair o nome do cliente da primeira resposta livre
    if (conversationHistory.length === 2 && clientName === "cliente") {
      // A segunda entrada é a primeira resposta do usuário
      // Você precisaria de um LLM aqui para extrair o nome ou uma Regex.
      // Exemplo Simples (muito básico, mas para ilustrar):
      const nameMatch = clientInfo.match(
        /(?:meu nome é|chamo-me|sou)\s+([A-Za-z\s]+)/i
      );
      if (nameMatch && nameMatch[1]) {
        clientName = nameMatch[1].trim();
      }
      // Para uma extração robusta, você usaria o Gemini para "extrair o nome"
      // de uma string livre, o que adicionaria mais uma chamada à API.
    }
  } // Fim do while true

  rl.close();
  console.log("\nAtendimento finalizado. Obrigado!");
  console.log("\n--- Histórico Completo da Conversa ---");
  conversationHistory.forEach((msg) => {
    console.log(
      `${msg.role === "user" ? "CLIENTE" : "SR. GIOPPO"}: ${msg.parts[0].text}`
    );
  });
}
