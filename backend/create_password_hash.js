import bcrypt from 'bcryptjs';

// Troque este valor para a senha que deseja converter em hash
const plainPassword = 'teste';

bcrypt.hash(plainPassword, 10, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
  } else {
    console.log('Hash gerado:', hash);
  }
});
