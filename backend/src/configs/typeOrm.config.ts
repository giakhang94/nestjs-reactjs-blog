// import { DataSourceOptions } from 'typeorm';
// interface InstanceType {
//   type: DataSourceOptions['type'];
//   host: string;
//   username: string;
//   port: number;
//   password: string;
//   database: string;
//   synchronize: boolean;
//   entities: string[];
// }
// export class TypeOrmConfig {
//   private readonly type: DataSourceOptions['type'];
//   private readonly host: string;
//   private readonly username: string;
//   private readonly port: number;
//   private readonly database: string;
//   private readonly password: string;
//   private readonly synchronize: boolean;
//   private readonly entities: string[];
//   constructor(config: InstanceType) {
//     this.type = config.type;
//     this.host = config.host;
//     this.database = config.database;
//     this.username = config.username;
//     this.password = config.password;
//     this.port = config.port || 3306;
//     this.synchronize = config.synchronize;
//     this.entities = config.entities;
//   }
//   getTypeOrmConfig(): DataSourceOptions {
//     return {
//       type: this.type,
//       host: this.host,
//       database: this.database,
//       username: this.username,
//       password: this.password,
//       port: this.port,
//       synchronize: this.synchronize,
//       entities: this.entities,
//     } as DataSourceOptions;
//   }
// }
