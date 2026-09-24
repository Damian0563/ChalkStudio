import { randomUUID } from 'crypto'
import { Storage } from '@google-cloud/storage'
const bucketName = 'chalkstudio-bucket'
const signedUrlTtl = 1000 * 60 * 60 * 24 * 7

export const useBucket = () => {
	const storage = new Storage()
	const uploadImage = async (room: string, body: Buffer, contentType: string): Promise<{ imageId: string, objectName: string }> => {
		const imageId = randomUUID()
		const extension = contentType.split('/')[1] ?? 'bin'
		const file = storage.bucket(bucketName).file(`boards/${room}/${imageId}.${extension}`)
		await file.save(body, { contentType })
		return { imageId, objectName: `boards/${room}/${imageId}.${extension}` }
	}

	const signImageUrl = async (objectName: string): Promise<string> => {
		const [url] = await storage.bucket(bucketName).file(objectName).getSignedUrl({
			version: 'v4',
			action: 'read',
			expires: Date.now() + signedUrlTtl,
		})
		return url
	}

	return { uploadImage, signImageUrl }
}
