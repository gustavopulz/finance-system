import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: 'localhost',
  user: 'root', // ajuste se tiver senha
  password: '', // coloque sua senha se tiver
  database: 'finance_system',
});
