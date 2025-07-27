export enum Role {
  admin = 'admin',
  author = 'author',
}
export type UserPayload = {
  userId: number;
  iat: number;
  exp: number;
  role: Role;
};
