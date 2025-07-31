export enum Role {
  admin = 'admin',
  author = 'author',
}

export enum Role_filter {
  admin = 'admin',
  author = 'author',
  all = 'all',
}

export enum Status {
  published,
  draft,
  editing,
  deleted,
}

export type UserPayload = {
  userId: number;
  iat: number;
  exp: number;
  role: Role;
};
