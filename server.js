require('dotenv').config();

const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true }
}))

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.execute('SELECT id, password_hash FROM users WHERE username = ?', [username])

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash)

    if (match) {
      req.session.userId = user.id;
      res.json({ success: true, message: 'Login bem-sucedido' });
    } else {
      res.status(401).json({success: false, message: 'Senha incorreta'})
    }
  } catch (err) {
    console.error('Erro no login:', err)
    res.status(500).json({ success: false, message: 'Erro interno no servidor'})
  }  
})

function autenticar(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({success: false, message: 'Acesso não autorizado'});
  }
}

app.get('/admin/posts', autenticar, async (req, res) => {
  const [posts] = await db.execute('SELECT * FROM posts ORDER BY created_at DESC');
  res.json(posts);
})

app.post('/admin/posts', autenticar, async (req, res) => {
  const { title, content } = req.body;
  await db.execute('INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)', [title, content, req.session.userId]);
  res.json({ success: true, message: 'Post criado com sucesso' });
});

app.post('/logout', (req, res) => {
  req.session.destroy()
  res.json({ success: true, message: 'Logout realizado com sucesso' });
})

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/enviar-email', async (req, res) => {
  const { nome, email, cnpj, telefone, produto, meiocontato, mensagem } = req.body;

    const transporter = nodemailer.createTransport({
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

// Rota status para confirmar que o servidor está rodando
app.get('/status', (req, res) => {
  res.send('🟢 Node.js está respondendo corretamente!');
});

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Fallback para SPA (Single Page Application)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});