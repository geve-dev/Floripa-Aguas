CREATE DATABASE IF NOT EXISTS floripa_aguas;
USE floripa_aguas;

-- 1. Tabela de Usuários (Base para login e perfil)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(255) DEFAULT 'default.png'
);

-- 2. Tabela de Praias (Onde definimos a Região para o Filtro)
CREATE TABLE praias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_praia VARCHAR(100) NOT NULL,
    regiao ENUM('Norte', 'Sul', 'Leste', 'Oeste', 'Centro') NOT NULL
);

-- 3. Tabela de Ações (Posts) - Aqui incluímos a Data da Coleta e o Status
CREATE TABLE acoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    praia_id INT NOT NULL,
    status_balneabilidade ENUM('Propria', 'Impropria') NOT NULL,
    data_coleta DATE NOT NULL, -- Data em que a análise foi feita
    descricao TEXT,
    data_postagem DATETIME DEFAULT CURRENT_TIMESTAMP, -- Quando o post foi criado
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (praia_id) REFERENCES praias(id) ON DELETE CASCADE
);

-- 4. Tabelas de Interação (Separadas como você preferiu)
CREATE TABLE curtidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    acao_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (acao_id) REFERENCES acoes(id) ON DELETE CASCADE,
    UNIQUE KEY (usuario_id, acao_id)
);

CREATE TABLE comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    acao_id INT NOT NULL,
    texto_comentario TEXT NOT NULL,
    data_comentario DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (acao_id) REFERENCES acoes(id) ON DELETE CASCADE
);