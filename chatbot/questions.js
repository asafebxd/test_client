const ALL_POSSILBE_QUESTIONS = `
Aqui estão as perguntas que você pode fazer e suas opções, para guiar o cliente:

--- PERGUNTAS E OPÇÕES DISPONÍVEIS ---

# Pergunta ID: descendencia_familiar
Pergunta: Olá {{nome do cliente}}, muito prazer! Por favor, digite o número da opção que mais se encaixa com você:
Opções:
1. Sou descendente de italianos e quero fazer minha cidadania italiana.
2. Não tenho certeza ainda sobre a minha ascendência.
3. Já sou italiano reconhecido e preciso de serviços consulares.
4. Quero falar sobre outra cidadania (portuguesa/espanhola) ou outros assuntos.

# Pergunta ID: cidadania_italiana_origem
Pergunta: Ótimo! Para a cidadania italiana, vamos entender direitinho sua situação para te orientar da melhor forma. Você já sabe quem é o italiano da sua família?
Opções:
1. Meu pai ou avô
2. Meu bisavô
3. Meu trisavô ou tetravô
4. Não sei quem é o italiano, mas tenho certeza que sou descendente!

# Pergunta ID: pesquisa_origem
Pergunta: Perfeito! Se você não tem certeza da sua ascendência, podemos te ajudar com uma pesquisa de origem. Qual é o seu principal objetivo com essa pesquisa?
Opções:
1. Apenas curiosidade genealógica
2. Reconhecimento de cidadania (futuramente)
3. Obter documentos da família

# Pergunta ID: servicos_consulares
Pergunta: Que bom que você já é um cidadão italiano! Quais serviços consulares você precisa?
Opções:
1. Inscrição AIRE
2. Renovação de Passaporte
3. Registro de Nascimento/Casamento/Óbito
4. Outros serviços

# Pergunta ID: outras_cidadanias
Pergunta: Entendi! Queremos te ajudar com outras cidadanias. Você busca cidadania portuguesa, espanhola ou alguma outra?
Opções:
1. Portuguesa
2. Espanhola
3. Outra (especificar)

--- MENSAGEM FINAL ---
FINALIZAR_CONVERSA: Agradecemos suas respostas! Com base nas suas escolhas, a equipe da Gioppo & Conti identificou suas necessidades e entrará em contato em breve com sugestões personalizadas. Seu caminho para a cidadania começa agora!
`;

export default ALL_POSSILBE_QUESTIONS;
