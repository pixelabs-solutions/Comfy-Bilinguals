import * as bcrypt from 'bcrypt';

export function hashPassword(password: string) {
  const salt = bcrypt.genSaltSync();
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(plainTextPassword, hashedPassword) {
  return bcrypt.compareSync(plainTextPassword, hashedPassword);
}
