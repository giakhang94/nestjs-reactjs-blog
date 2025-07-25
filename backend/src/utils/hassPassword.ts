import * as bcrypt from 'bcrypt';
export async function hashPw(password: string, salt: number) {
  const hashedPw = await bcrypt.hash(password, salt);
  return hashedPw;
}

export async function comparePw(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
}
