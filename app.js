import "dotenv/config"
import { GoogleGenerativeAI } from "@google/generative-ai";
import readline from 'readline';
const GOOGLE_API_KEY = process.env.API_KEY

if(!GOOGLE_API_KEY) {
    console.error("API_KEY: undefined")
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

        const result = await model.generateContent("Exlpain how gemini API works");

        const responseText = result.response.text();

        console.log(responseText);
        
    }catch(error) {
        console.log("API Error: error");
        if (error.response && error.response.data) {
            console.error("Detalhes do erro:", error.response.data);
        } else if (error.message) {
            console.error("Mensagem de erro:", error.message);
        } else {
            console.error("Erro completo:", error);
        }
    }  finally {
        rl.close();
    }
};

main();
