import { test, expect, afterAll } from "vitest"
import { Storage } from "@google-cloud/storage"
import { useBucket } from "../../server/utils/images/bucket"

const { uploadImage, signImageUrl } = useBucket()
const body = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000", "hex")
const uploaded: string[] = []

afterAll(async () => {
	const bucket = new Storage().bucket("chalkstudio-bucket")
	await Promise.all(uploaded.map(objectName => bucket.file(objectName).delete({ ignoreNotFound: true })))
})

test("Bucket upload and signed read", async () => {
	const { imageId, objectName } = await uploadImage("e2e", body, "image/png")
	uploaded.push(objectName)
	expect(objectName).toBe(`boards/e2e/${imageId}.png`)

	const url = new URL(await signImageUrl(objectName))
	expect(url.searchParams.get("X-Goog-Algorithm")).toBe("GOOG4-RSA-SHA256")
	expect(Number(url.searchParams.get("X-Goog-Expires"))).toBeGreaterThan(60 * 60 * 24 * 7 - 60)
	expect(Number(url.searchParams.get("X-Goog-Expires"))).toBeLessThanOrEqual(60 * 60 * 24 * 7)

	const signed = await fetch(url)
	expect(signed.status).toBe(200)
	expect(signed.headers.get("content-type")).toBe("image/png")
	expect(Buffer.from(await signed.arrayBuffer())).toEqual(body)

	const unsigned = await fetch(`${url.origin}${url.pathname}`)
	expect(unsigned.status).toBe(403)
})
