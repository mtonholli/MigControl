require('dotenv').config();

const session = require('express-session');
const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
})

// Middleware de autenticação
function autenticar(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({success: false, message: 'Acesso não autorizado'});
  }
}

// ========== ROTAS DE AUTENTICAÇÃO ==========

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Login tentando usuário:', username);

    const [rows] = await db.query(
      'SELECT id, password_hash FROM users WHERE username = ?',
      [username]
    );
    console.log('Query resultado:', rows);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
    }

    const user = rows[0];
    console.log('Hash da senha armazenada:', user.password_hash);

    const match = await bcrypt.compare(password, user.password_hash);
    console.log('Senha correta?', match);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Senha incorreta' });
    }

    // Se chegou aqui, a senha está correta
    console.log('Sessão antes de setar userId:', req.session);
    req.session.userId = user.id;
    console.log('Sessão após setar userId:', req.session);

    return res.redirect('/admin/dashboard.html');

  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
  }
});



app.post('/logout', (req, res) => {
  req.session.destroy()
  res.json({ success: true, message: 'Logout realizado com sucesso' });
})

// ========== ROTAS DO BLOG - ADMIN ==========

// Listar todos os posts (Admin)
app.get('/admin/posts', autenticar, async (req, res) => {
  try {
    const [posts] = await db.execute(`
      SELECT p.*, u.username as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Buscar post específico por ID (Admin)
app.get('/admin/posts/:id', autenticar, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [posts] = await db.execute(`
      SELECT p.*, u.username as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      WHERE p.id = ?
    `, [id]);

    if (posts.length === 0) {
      return res.status(404).json({ success: false, message: 'Post não encontrado' });
    }

    res.json(posts[0]);
  } catch (error) {
    console.error('Erro ao buscar post:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Criar novo post (Admin)
app.post('/admin/posts', autenticar, async (req, res) => {
  const { title, content, image } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Título e conteúdo são obrigatórios' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO posts (title, content, image, author_id, created_at, updated_at) VALUES (?, ?, ?, ?', 
      [title, content, image, req.session.userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Post criado com sucesso',
      postId: result.insertId 
    });
  } catch (error) {
    console.error('Erro ao criar post:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Atualizar post existente (Admin)
app.put('/admin/posts/:id', autenticar, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Título e conteúdo são obrigatórios' });
  }

  try {
    // Verificar se o post existe
    const [existingPost] = await db.execute('SELECT id FROM posts WHERE id = ?', [id]);
    
    if (existingPost.length === 0) {
      return res.status(404).json({ success: false, message: 'Post não encontrado' });
    }

    // Atualizar o post
    await db.execute(
      'UPDATE posts SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
      [title, content, id]
    );

    res.json({ success: true, message: 'Post atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar post:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Excluir post (Admin)
app.delete('/admin/posts/:id', autenticar, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar se o post existe
    const [existingPost] = await db.execute('SELECT id FROM posts WHERE id = ?', [id]);
    
    if (existingPost.length === 0) {
      return res.status(404).json({ success: false, message: 'Post não encontrado' });
    }

    // Excluir o post
    await db.execute('DELETE FROM posts WHERE id = ?', [id]);

    res.json({ success: true, message: 'Post excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir post:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ========== ROTAS DO BLOG - PÚBLICO ==========

// Listar posts públicos (para o blog público)
app.get('/api/posts', async (req, res) => {
  try {
    const [posts] = await db.execute(`
      SELECT p.id, p.title, p.content, p.created_at, p.updated_at, u.username as author_name
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts públicos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Buscar post público específico por ID
app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [posts] = await db.execute(`
      SELECT p.id, p.title, p.content, p.created_at, p.updated_at, u.username as author_name
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      WHERE p.id = ?
    `, [id]);

    if (posts.length === 0) {
      return res.status(404).json({ success: false, message: 'Post não encontrado' });
    }

    res.json(posts[0]);
  } catch (error) {
    console.error('Erro ao buscar post:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// ========== ROTA DE EMAIL ==========

app.post('/enviar-email', async (req, res) => {
  const { nome, email, cnpj, telefone, produto, meiocontato, mensagem } = req.body;

  const transporter = nodemailer.createTransporter({
    host: 'localhost',
    port: 25,
    secure: false,
    tls: { rejectUnauthorized: false }
  });

  const htmlMessage = `
    <h3>Nova mensagem de contato - MigControl</h3>
    <p><strong>Nome:</strong> ${nome}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>CNPJ:</strong> ${cnpj}</p>
    <p><strong>Telefone:</strong> ${telefone}</p>
    <p><strong>Produto:</strong> ${produto}</p>
    <p><strong>Meio de Contato:</strong> ${meiocontato}</p>
    <p><strong>Mensagem:</strong><br/>${mensagem}</p>
  `;

  try {
    await transporter.sendMail({
      from: `"${nome}" <${process.env.EMAIL_USER}>`,
      to: 'comercial@migcontrol.com.br',
      subject: `Contato via formulário - ${nome}`,
      html: htmlMessage,
    });

    res.status(200).json({ success: true, message: 'E-mail enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ success: false, message: 'Erro ao enviar e-mail.' });
  }
});

// ========== ROTAS GERAIS ==========

// Rota status para confirmar que o servidor está rodando
app.get('/status', (req, res) => {
  res.send('🟢 Node.js está respondendo corretamente!');
});

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Fallback para SPA (Single Page Application)
app.get(/^\/(?!api|admin).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});