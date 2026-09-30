import { createHash } from 'crypto'
import { Storage } from '@google-cloud/storage'
const bucketName = 'chalkstudio-bucket'
const signedUrlTtl = 1000 * 60 * 60 * 24 * 7

export const useBucket = () => {
	const storage = new Storage()
	const uploadImage = async (room: string, body: Buffer, contentType: string): Promise<{ imageId: string, objectName: string }> => {
		const imageId = createHash('sha256').update(body).digest('hex')
		const objectName = `boards/${room}/${imageId}`
		try {
			await storage.bucket(bucketName).file(objectName).save(body, { contentType, preconditionOpts: { ifGenerationMatch: 0 } })
		} catch (error) {
			if ((error as { code?: number }).code !== 412) throw error
		}
		return { imageId, objectName }
	}

	const signImageUrl = async (objectName: string): Promise<string> => {
		const [url] = await storage.bucket(bucketName).file(objectName).getSignedUrl({
			version: 'v4',
			action: 'read',
			expires: Date.now() + signedUrlTtl,
		})
		return url
	}

	// Signing never looks at the bucket, so a missing object still gets a URL.
	const imageExists = async (objectName: string): Promise<boolean> => {
		const [exists] = await storage.bucket(bucketName).file(objectName).exists()
		return exists
	}

	return { uploadImage, signImageUrl, imageExists }
}
