import { Database, Connection } from "duckdb-async";
import { PairInfoData, SwapOperationData, WithdrawLiquidityOperationData } from "./types";
import fs from "fs";

export class DuckDb {
  protected constructor(public readonly conn: Connection) {}

  static async create(fileName?: string): Promise<DuckDb> {
    const db = await Database.create(fileName ?? "data");
    const conn = await db.connect();
    return new DuckDb(conn);
  }

  private async insertBulkData(data: any[], tableName: string, replace?: boolean) {
    // we wont insert anything if the data is empty. Otherwise it would throw an error while inserting
    if (data.length === 0) return;
    const tableFile = `${tableName}.json`;
    // the file written out is temporary only. Will be deleted after insertion
    await fs.promises.writeFile(tableFile, JSON.stringify(data));
    const query = replace
      ? `INSERT OR REPLACE INTO ${tableName} SELECT * FROM read_json_auto(?)`
      : `INSERT INTO ${tableName} SELECT * FROM read_json_auto(?)`;
    await this.conn.run(query, tableFile);
    await fs.promises.unlink(tableFile);
  }

  // sync height table
  async createHeightSnapshot() {
    await this.conn.exec("CREATE TABLE IF NOT EXISTS height_snapshot (config VARCHAR PRIMARY KEY, value UINTEGER)");
  }

  async loadHeightSnapshot() {
    const result = await this.conn.all("SELECT value FROM height_snapshot where config = 'last_block_height'");
    return result.length > 0 ? result[0].value : { currentInd: 1 };
  }

  async insertHeightSnapshot(currentInd: number) {
    await this.conn.run("INSERT OR REPLACE into height_snapshot VALUES ('last_block_height',?)", currentInd);
  }

  // swap operation table handling
  async createSwapOpsTable() {
    await this.conn.exec(
      "CREATE TABLE IF NOT EXISTS swap_ops_data (txhash VARCHAR, timestamp TIMESTAMP, offerDenom VARCHAR, offerAmount UBIGINT, askDenom VARCHAR, returnAmount UBIGINT, taxAmount UBIGINT, commissionAmount UBIGINT, spreadAmount UBIGINT)"
    );
  }

  async insertSwapOps(ops: SwapOperationData[]) {
    await this.insertBulkData(ops, "swap_ops_data");
  }

  // liquidity operations (provide, withdraw lp) handling
  async createLiquidityOpsTable() {
    try {
      await this.conn.all("select enum_range(NULL::LPOPTYPE);");
    } catch (error) {
      // if error it means the enum does not exist => create new
      await this.conn.exec("CREATE TYPE LPOPTYPE AS ENUM ('provide','withdraw');");
    }
    await this.conn.exec(
      "CREATE TABLE IF NOT EXISTS lp_ops_data (txhash VARCHAR, timestamp TIMESTAMP, firstTokenAmount UBIGINT, firstTokenDenom VARCHAR, secondTokenAmount UBIGINT, secondTokenDenom VARCHAR, txCreator VARCHAR, opType LPOPTYPE)"
    );
  }

  async insertLpOps(ops: WithdrawLiquidityOperationData[]) {
    await this.insertBulkData(ops, "lp_ops_data");
  }

  // store all the current pair infos of oraiDEX. Will be updated to the latest pair list after the sync is restarted
  async createPairInfosTable() {
    await this.conn.exec(
      "CREATE TABLE IF NOT EXISTS pair_infos (firstAssetInfo VARCHAR, secondAssetInfo VARCHAR, commissionRate VARCHAR, pairAddr VARCHAR, liquidityAddr VARCHAR, oracleAddr VARCHAR,PRIMARY KEY (pairAddr) )"
    );
  }

  async insertPairInfos(ops: PairInfoData[]) {
    await this.insertBulkData(ops, "pair_infos", true);
  }

  // we need to:
  // price history should contain: timestamp, tx height, tx hash, asset info, price
  // if cannot find then we spawn another stream and sync it started from the common sync height. We will re-sync it if its latest height is too behind compared to the common sync height

  async querySwapOps() {
    return this.conn.all("SELECT count(*) from swap_ops_data");
  }

  async queryLpOps() {
    return this.conn.all("SELECT count(*) from lp_ops_data");
  }
}
