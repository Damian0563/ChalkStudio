import { codes } from "./schema";
import { sql } from "drizzle-orm";
import { getPool } from "./connection";

export const useLoginCodeRepository = async () => {
	const pool = await getPool();

	const insertLoginCode = async (email: string, code: string) => {
		const mail = sql.identifier(codes.mail.name);
		const codeCol = sql.identifier(codes.code.name);
		const expiresAt = sql.identifier(codes.expiresAt.name);
		const normalized = email.trim().toLowerCase();

		await pool.execute(sql`
			with pruned as (
				delete from ${codes} where ${codes.expiresAt} < now() and ${codes.mail} <> ${normalized}
			)
			insert into ${codes} (${mail}, ${codeCol}, ${expiresAt})
			values (${normalized}, ${code}, now() + interval '15 minutes')
			on conflict (${mail}) do update
			set ${codeCol} = excluded.${codeCol}, ${expiresAt} = excluded.${expiresAt}
		`);
	};

	const consumeLoginCode = async (email: string, code: string): Promise<boolean> => {
		const consumed = await pool
			.delete(codes)
			.where(
				sql`${codes.mail} = ${email.trim().toLowerCase()} and ${codes.code} = ${code.trim()} and ${codes.expiresAt} > now()`,
			)
			.returning({ mail: codes.mail });
		return consumed.length > 0;
	};

	return {
		insertLoginCode,
		consumeLoginCode,
	};
};
