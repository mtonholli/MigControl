const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

(async () => {
  const db = mysql.createPool({
    host: 'localhost',
    user: 'admin',
    password: 'senha123',
    database: 'blog_app'
  });

  const [rows] = await db.query('SELECT id, password_hash FROM users WHERE username = ?', ['admin']);
  console.log('Usuário:', rows[0]);

  const match = await bcrypt.compare('senha123', rows[0].password_hash);
  console.log('Senha bate?', match);
})();