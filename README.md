Tickets Suporte - Sistema de Gestão de Chamados

Sistema de gestão de tickets estilo Kanban desenvolvido para equipes de Suporte. O projeto inclui um quadro interativo, dashboard de métricas e controle de acesso baseado em funções (RBAC).

🚀 Funcionalidades

📋 Gestão de Tickets

Kanban Board: Movimentação de tickets via Drag and Drop entre colunas.

CRUD Completo: Criação, Edição, Movimentação e Exclusão de tickets.

Filtros Inteligentes: Pesquisa global por ID, Título, Solicitante ou Módulo.

Atribuição: Definição de técnico responsável e empresa solicitante.

📊 Dashboard Analítico

KPIs: Total de tickets, Urgentes, Tempo Médio de Resolução e Eficiência Semanal.

Gráficos Visuais:

Distribuição por Prioridade (Pizza).

Volume de Tickets por Dia (Linha).

Top 5 Técnicos com mais demandas (Barra).

🛡️ Segurança e Regras

Autenticação: Login com persistência de sessão.

Perfis de Acesso (RBAC):

MASTER: Acesso total (inclui exclusão).

ADMIN: Acesso total de edição/movimentação.

NORMAL: Apenas visualiza todos, mas só edita/move os tickets criados por ele mesmo.

SLA Lógico: O tempo de resolução só é contabilizado quando o ticket sai das colunas de espera ("A Fazer", "Apoio", "Transferido").

🛠️ Tecnologias Utilizadas

Frontend:

React.js (Vite)

Tailwind CSS (Estilização e Dark Mode)

Lucide React (Ícones)

Recharts (Gráficos)

Backend:

Node.js + Express

mssql (Driver SQL Server)

CORS

Banco de Dados:

SQL Server

⚙️ Pré-requisitos

Node.js (v18+)

SQL Server instalado e rodando.

Credenciais de acesso ao banco configuradas.

📦 Instalação e Configuração

1. Configuração do Banco de Dados (SQL Server)

Execute os scripts abaixo no seu SQL Management Studio para criar a estrutura necessária:

-- Cria o Banco
CREATE DATABASE TicketSupportDB;
GO
USE TicketSupportDB;
GO

-- Tabela de Tickets
CREATE TABLE Tickets (
    id VARCHAR(50) PRIMARY KEY,
    title NVARCHAR(255),
    priority NVARCHAR(50),
    type NVARCHAR(50),
    requester NVARCHAR(100),
    responsible NVARCHAR(100),
    columnId VARCHAR(50) NOT NULL,
    createdBy INT,
    createdAt DATETIME DEFAULT GETDATE(),
    finishedAt DATETIME NULL
);
GO

-- Tabela de Usuários
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    password NVARCHAR(50) NOT NULL,
    role NVARCHAR(20) NOT NULL -- 'MASTER', 'ADMIN', 'NORMAL'
);
GO

-- Usuários Padrão
INSERT INTO Users (username, password, role) VALUES 
('master', 'master123', 'MASTER'),
('admin', 'admin123', 'ADMIN'),
('user1', 'user123', 'NORMAL');
GO


2. Configuração do Backend

Crie uma pasta server.

Crie o arquivo server.js com o código fornecido.

Instale as dependências:

npm init -y
npm install express mssql cors


Regra de Ouro (Configuração DB): Certifique-se que o server.js contém:

Server: NOTE-32

User: sa

Password: SIMERP

Inicie o servidor:

node server.js


O servidor rodará na porta 5000 (acessível via IP da rede).

3. Configuração do Frontend

Na raiz do projeto React:

npm install
npm install lucide-react recharts


Inicie a aplicação:

npm run dev
# Para expor na rede local use: npm run dev -- --host


📐 Regras de Negócio Implementadas

Cálculo de Eficiência:

Fórmula: (Tickets Finalizados na semana / Tickets Criados na semana) * 100.

Ignora tickets nas colunas "Apoio" e "Transferido" para não distorcer a métrica de produtividade da equipe interna.

Cálculo de Tempo de Resolução:

Considera apenas tickets na coluna "Finalizado".

Calcula a diferença entre createdAt e finishedAt.

Visualmente, nos cartões, o tempo aparece como "Sem Contagem" se o ticket estiver em "A Fazer", "Apoio" ou "Transferido".

Proteção de Dados:

O ID do ticket é definido manualmente na criação e bloqueado para edição posteriormente.

Se o usuário for nível NORMAL, o backend bloqueia tentativas de edição/movimentação de tickets de terceiros, mesmo que a interface seja burlada.

🎨 Personalização

Tipos de Tickets: A lista de módulos (SIMPDV, SIMFinanceiro, etc.) está definida na constante TICKET_TYPES no App.jsx.

Colunas: As colunas e suas cores estão definidas no objeto emptyStructure e LEGACY_STATUS_MAP no App.jsx.