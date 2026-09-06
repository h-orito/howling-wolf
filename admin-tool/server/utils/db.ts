import mysql, {
  type Pool,
  type ResultSetHeader,
  type RowDataPacket
} from 'mysql2/promise'

let pool: Pool | null = null

export const getDbTarget = (): string => {
  const config = useRuntimeConfig()
  return `${config.dbUser}@${config.dbHost}:${config.dbPort}/${config.dbName}`
}

export const getPool = (): Pool => {
  if (pool) return pool
  const config = useRuntimeConfig()
  pool = mysql.createPool({
    host: config.dbHost,
    port: Number(config.dbPort),
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    connectionLimit: 5,
    // DATETIME を JS Date に変換せず 'YYYY-MM-DD HH:mm:ss' 文字列のまま受け取る
    dateStrings: true,
    charset: 'utf8mb4'
  })
  return pool
}

export const query = async <T extends RowDataPacket>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> => {
  const [rows] = await getPool().query<T[]>(sql, params)
  return rows
}

/** MySQL の BOOLEAN (TINYINT) を boolean に変換する */
export const toBoolean = (value: number | boolean | null): boolean =>
  value === true || value === 1

/** LIKE 検索用にワイルドカードをエスケープする */
export const escapeLike = (value: string): string =>
  value.replace(/[\\%_]/g, (c) => `\\${c}`)

/** INSERT / UPDATE / DELETE を実行し、影響行数を返す */
export const execute = async (
  sql: string,
  params: unknown[] = []
): Promise<number> => {
  const [result] = await getPool().query<ResultSetHeader>(sql, params)
  return result.affectedRows
}
