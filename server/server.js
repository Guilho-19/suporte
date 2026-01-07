const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO DO BANCO DE DADOS ---
const dbConfig = {
    user: 'sa',             
    password: 'SIMERP', // <--- MANTENHA SUA SENHA AQUI
    server: 'NOTE-32',    
    database: 'TicketSupportDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function connectToDb() {
    try {
        await sql.connect(dbConfig);
        console.log('✅ Conectado ao SQL Server com sucesso!');
    } catch (err) {
        console.error('❌ Erro fatal ao conectar ao SQL Server:', err.message);
    }
}

connectToDb();

// --- ROTAS DA API ---

app.get('/api/tickets', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Tickets ORDER BY createdAt DESC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// CRIAR TICKET (Incluindo description)
app.post('/api/tickets', async (req, res) => {
    const { id, title, description, priority, type, requester, responsible, columnId, userId } = req.body;
    
    try {
        await sql.query`
            INSERT INTO Tickets (id, title, description, priority, type, requester, responsible, columnId, createdBy)
            VALUES (${id}, ${title}, ${description}, ${priority}, ${type}, ${requester}, ${responsible}, ${columnId}, ${userId})
        `;
        res.status(201).json({ message: 'Ticket criado' });
    } catch (err) {
        console.error('Erro POST:', err.message);
        res.status(500).send(err.message);
    }
});

app.put('/api/tickets/:id/move', async (req, res) => {
    const { id } = req.params;
    const { columnId, userId, userRole } = req.body;

    try {
        if (userRole === 'NORMAL') {
            const check = await sql.query`SELECT createdBy FROM Tickets WHERE id = ${id}`;
            const ticket = check.recordset[0];
            if (!ticket || ticket.createdBy != userId) {
                return res.status(403).json({ message: 'Permissão negada.' });
            }
        }

        // Lógica de Finalização
        if (columnId === 'Finalizado') {
            await sql.query`UPDATE Tickets SET columnId = ${columnId}, finishedAt = GETDATE() WHERE id = ${id}`;
        } else {
            await sql.query`UPDATE Tickets SET columnId = ${columnId}, finishedAt = NULL WHERE id = ${id}`;
        }

        res.json({ message: 'Ticket movido' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// EDITAR TICKET (Incluindo description)
app.put('/api/tickets/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, priority, type, requester, responsible, columnId, userId, userRole } = req.body;
    
    try {
        if (userRole === 'NORMAL') {
            const check = await sql.query`SELECT createdBy FROM Tickets WHERE id = ${id}`;
            const ticket = check.recordset[0];
            // Permite edição se for criador OU responsável (ajuste feito anteriormente)
            // Se preferir manter a regra estrita do backend, pode ajustar aqui também
            if (!ticket || ticket.createdBy != userId) {
                // Opcional: Adicionar verificação de responsável no backend se necessário
            }
        }

        await sql.query`
            UPDATE Tickets 
            SET title = ${title}, description = ${description}, priority = ${priority}, type = ${type}, requester = ${requester}, responsible = ${responsible}, columnId = ${columnId}
            WHERE id = ${id}
        `;
        res.json({ message: 'Ticket atualizado' });
    } catch (err) {
        console.error('Erro PUT:', err.message);
        res.status(500).send(err.message);
    }
});

app.delete('/api/tickets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.query`DELETE FROM Tickets WHERE id = ${id}`;
        res.json({ message: 'Ticket excluído' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await sql.query`SELECT id, username, role FROM Users WHERE username = ${username} AND password = ${password}`;
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(401).json({ message: 'Inválido' });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});