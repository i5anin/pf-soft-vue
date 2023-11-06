require('dotenv').config(); // Это должно быть в самом верху файла
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const dbConfig = require('../config').dbConfig;

// Создаем экземпляр pool используя конфигурацию из вашего файла config
const pool = new Pool(dbConfig);


exports.validateUser = async (req, res) => {
  const { login, password } = req.body;

  try {
    const query = 'SELECT * FROM "dbo"."login" WHERE login = $1';
    const user = await pool.query(query, [login]);

    console.log('User found:', user.rows[0]);
    console.log('Submitted password:', password);

    if (user.rows.length > 0) {
      // Сравниваем пароль в чистом виде
      const isValid = (password === user.rows[0].password);

      console.log('Password valid:', isValid);

      if (isValid) {
        const token = jwt.sign(
          { id: user.rows[0].id, access: user.rows[0].access },
          process.env.SECRET_KEY, // Используйте переменную окружения или запасной ключ
          { expiresIn: '1h' }
        );
        res.json({ token });
      } else {
        res.status(401).send('Invalid credentials');
      }
    } else {
      res.status(401).send('User not found');
    }
  } catch (err) {
    console.error('Error during user validation:', err.message);
    res.status(500).send('Internal Server Error');
  }
};
