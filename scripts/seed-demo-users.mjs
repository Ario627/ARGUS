import bcrypt from "bcrypt";
import pg from "pg";
import { v7 as uuidv7 } from "uuid";

const DEMO_SPPG_ID = "01900000-0000-7000-8000-00000000d001";
const DEMO_FACILITY_ID = "01900000-0000-7000-8000-00000000d201";
const DEMO_FLEET_ID = "01900000-0000-7000-8000-00000000f001";

const PASSWORD = process.env.DEMO_PASSWORD?.trim() || "password123";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

const ACCOUNTS = [
  {
    username: "staf_demo",
    nama: "Staf SPPG Demo",
    role: "sppg_staff",
    sppgId: DEMO_SPPG_ID,
  },
  {
    username: "driver_demo",
    nama: "Pengemudi Demo",
    role: "driver",
    fleetId: DEMO_FLEET_ID,
  },
  {
    username: "fasilitas_demo",
    nama: "Operator Fasilitas Demo",
    role: "facility",
    fasilitasId: DEMO_FACILITY_ID,
  },
  {
    username: "auditor_demo",
    nama: "Auditor DLH Demo",
    role: "dlh_auditor",
  },
];

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  application_name: "argus-seed-users",
});

const ensureFleet = async () => {
  await client.query(
    `INSERT INTO fleet (
       id, kode, plat, driver_nama, kapasitas_kg,
       status_operasional, last_lat, last_lng, last_device_timestamp, aktif, is_demo
     )
     VALUES ($1, $2, $3, $4, $5, 'ONLINE_NORMAL', $6, $7, now(), TRUE, TRUE)
     ON CONFLICT (id) DO NOTHING`,
    [
      DEMO_FLEET_ID,
      "DEMO-01",
      "D 0001 ARG",
      "Pengemudi Demo",
      800,
      -6.9147,
      107.6098,
    ],
  );
};

const ensureUser = async (account) => {
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);
  const result = await client.query(
    `INSERT INTO "user" (
       id, username, password_hash, nama, role, sppg_id, fasilitas_id, fleet_id
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (username) DO NOTHING`,
    [
      uuidv7(),
      account.username,
      passwordHash,
      account.nama,
      account.role,
      account.sppgId ?? null,
      account.fasilitasId ?? null,
      account.fleetId ?? null,
    ],
  );
  return (result.rowCount ?? 0) > 0;
};

const main = async () => {
  await client.connect();
  try {
    await ensureFleet();
    for (const account of ACCOUNTS) {
      const created = await ensureUser(account);
      console.log(`${created ? "dibuat" : "sudah-ada"}: ${account.username}`);
    }
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
