// server.js
const express = require('express');
const fs = require('fs').promises; // Usar promessas para operações assíncronas de arquivo
const path = require('path');
const cors = require('cors'); // Para permitir requisições de diferentes origens (importante para o ambiente de produção)

const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta definida pelo ambiente (Render.com), ou 3000 localmente

// Middleware para processar JSON no corpo das requisições
app.use(express.json());

// Middleware CORS para permitir requisições de outras origens (importante para produção)
app.use(cors());

// Servir arquivos estáticos (HTML, CSS, JS do frontend, imagens, questoes.json)
app.use(express.static(path.join(__dirname, ''))); // Serve a pasta raiz onde index.html e questoes.json estão
app.use('/images', express.static(path.join(__dirname, 'images'))); // Se você tiver uma pasta 'images'

// Caminho para o arquivo de respostas
const respostasFilePath = path.join(__dirname, 'data', 'respostas.json');

// Garante que o diretório 'data' exista
async function ensureDataDirectory() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.mkdir(dataDir, { recursive: true });
        console.log('Diretório "data" garantido.');
    } catch (error) {
        if (error.code !== 'EEXIST') { // Ignora erro se o diretório já existe
            console.error('Erro ao criar diretório "data":', error);
        }
    }
}

// Rota para salvar os resultados
app.post('/save-results', async (req, res) => {
    await ensureDataDirectory(); // Garante que o diretório 'data' exista antes de tentar ler/escrever

    const newResult = req.body;
    let currentResults = [];

    try {
        const data = await fs.readFile(respostasFilePath, 'utf8');
        currentResults = JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('Arquivo respostas.json não encontrado, criando um novo.');
        } else {
            console.error('Erro ao ler respostas.json:', error);
            return res.status(500).send('Erro interno do servidor ao ler dados.');
        }
    }

    currentResults.push(newResult);

    try {
        await fs.writeFile(respostasFilePath, JSON.stringify(currentResults, null, 2), 'utf8');
        res.status(200).send('Resultados salvos com sucesso!');
    } catch (error) {
        console.error('Erro ao escrever respostas.json:', error);
        res.status(500).send('Erro interno do servidor ao salvar dados.');
    }
});

// Opcional: Rota para servir o respostas.json (se você quiser acessá-lo diretamente)
app.get('/respostas.json', async (req, res) => {
    try {
        const data = await fs.readFile(respostasFilePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).send('Arquivo de respostas não encontrado.');
        } else {
            console.error('Erro ao ler respostas.json:', error);
            res.status(500).send('Erro interno do servidor.');
        }
    }
});


// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    ensureDataDirectory(); // Tenta criar o diretório 'data' na inicialização
});