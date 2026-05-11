const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const port = 3000;

//configuração do banco de dados
const pool = mysql.createPool({
    host:     'localhost',
    port:     3306,
    user:     'root',
    password: 'senai',
    database: 'floripa_aguas'
});

//preparando o servidor express para aceitar a requisição do json
app.use(cors());
app.use(express.json());


//definir as rodas/urls/endpoints do sistema

//login 
app.post('/login', async (req, res) =>{
    const { email, senha } = req.body;

    try{
        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ? AND senha = ?',
            [email, senha]
        );

        if (usuarios.length > 0){
            res.json({ success: true, user: usuarios[0] });
        } else {
            res.status(401).json({ success: false, message: 'Email ou senha incorretos'})
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro no servidor" });
    }
});


//posts
app.get('/cards', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const offset = (page - 1) * limit;

    try {
        // Query to get total count
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM acoes');
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        const userId = parseInt(req.query.usuario_id) || 0;

        // Query to get paginated cards
        const [cards] = await pool.query(`
            SELECT 
                a.id AS idCard,
                u.nome AS autor,
                u.foto_perfil,
                p.nome_praia,
                p.regiao,
                a.status_balneabilidade,
                DATE_FORMAT(a.data_coleta, '%d/%m/%Y') AS data_coleta_formatada,
                DATE_FORMAT(a.data_postagem, '%H:%i - %d/%m/%Y') AS postagem_formatada,
                (SELECT COUNT(*) FROM curtidas WHERE acao_id = a.id) AS total_curtidas,
                (SELECT COUNT(*) FROM comentarios WHERE acao_id = a.id) AS total_comentarios,
                (SELECT COUNT(*) FROM curtidas WHERE acao_id = a.id AND usuario_id = ?) AS ja_curtido
            FROM acoes a
            JOIN usuarios u ON a.usuario_id = u.id
            JOIN praias p ON a.praia_id = p.id
            ORDER BY a.data_postagem DESC
            LIMIT ? OFFSET ?;
        `, [userId, limit, offset]);

        res.json({
            cards,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error('Erro ao buscar cards:', error);
        res.status(500).json({ success: false, message: "Erro ao buscar postagens" });
    }
});

app.post('/cards', async (req, res) =>{
    const { usuario_id, nomePraia, regiao, statusBalneabilidade, dataColeta } = req.body;

    try {
        // 1. Procura se a praia já existe
        const [praias] = await pool.query(
            'SELECT id FROM praias WHERE nome_praia = ? AND regiao = ?',
            [nomePraia, regiao]
        );

        let praia_id;

        if (praias.length > 0) {
            // Praia já existe, usa o id dela
            praia_id = praias[0].id;
        } else {
            // Praia não existe, cria uma nova
            const [resultado] = await pool.query(
                'INSERT INTO praias (nome_praia, regiao) VALUES (?, ?)',
                [nomePraia, regiao]
            );
            praia_id = resultado.insertId;
        }

        // 2. Mapeia o status do formulário para o ENUM do banco
        // Formulário envia "Própria"/"Imprópria", banco espera "Propria"/"Impropria"
        const statusMap = { 'Própria': 'Propria', 'Imprópria': 'Impropria' };
        const status_db = statusMap[statusBalneabilidade] || statusBalneabilidade;

        // 3. Insere a ação (post)
        await pool.query(
            'INSERT INTO acoes (usuario_id, praia_id, status_balneabilidade, data_coleta) VALUES (?, ?, ?, ?)',
            [usuario_id, praia_id, status_db, dataColeta]
        );

        res.json({ success: true, message: "Postagem realizada com sucesso" });
    } catch (error) {
        console.error('Erro ao registrar card:', error);
        res.status(500).json({ success: false, message: "Erro ao registrar postagem" });
    }
})


//curtidas
app.post('/curtidas', async (req, res) => {
    const {usuario_id, acao_id} = req.body;
    console.log('Recebido /curtidas:', {usuario_id, acao_id});

    try {
        const [curtidas] = await pool.query(
            'SELECT id FROM curtidas WHERE usuario_id = ? AND acao_id = ?',
            [usuario_id, acao_id]
        );

        if (curtidas.length > 0){
            await pool.query(
                'DELETE FROM curtidas WHERE usuario_id = ? AND acao_id = ?',
                [usuario_id, acao_id]
            );
            res.json({ success: true, message: "Descurtida"})
        } else {
            await pool.query(
                'INSERT INTO curtidas (usuario_id, acao_id) VALUES (?,?)',
                [usuario_id, acao_id]
            );
            res.json({ success: true, message: "Curtida"})
        }
    } catch (error) {
        console.error('Erro ao curtir:', error);
        res.status(500).json({ success: false, message: "Erro ao curtir"});
    }
})

//servidor rodando
app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
});