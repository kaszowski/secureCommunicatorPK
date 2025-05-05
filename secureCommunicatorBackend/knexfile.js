require('dotenv').config({ path: '../.env' }); // Opcjonalnie, jeśli używasz .env do zmiennych lokalnych

module.exports = 
{
  development: 
  {
    client: 'pg',
    connection: 
    {
      host: process.env.DB_HOST || 'db',
      port: process.env.DB_PORT || 5432,
      user: process.env.POSTGRES_USER || 'user',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB || 'mydb'
    },
    migrations: 
    {
      directory: './migrations'
    },
    seeds: 
    {
      directory: './seeds'
    }
  },
};
