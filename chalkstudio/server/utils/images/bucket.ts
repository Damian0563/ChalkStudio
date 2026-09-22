import { randomUUID } from 'crypto'
const bucketName = 'chalkstudio-bucket'

const signedUrlTtl = 1000 * 60 * 60 * 12

export const useBucket = () => {
	// STUB: nothing reaches chalkstudio-bucket yet. Mints the image's identity and
	// returns it alongside the durable object name - never a URL - because the
	// name is what the board's imageSources column stores; a URL would rot there.
	const uploadImage = async (room: string, body: Buffer, contentType: string): Promise<{ imageId: string, objectName: string }> => {
		const imageId = randomUUID()
		const extension = contentType.split('/')[1] ?? 'bin'
		return { imageId, objectName: `boards/${room}/${imageId}.${extension}` }
	}

	// STUB: shaped like the real signed URL, minus the signature and with the
	// expiry carried in the clear, so the client path can be exercised end to end.
	const signImageUrl = async (objectName: string): Promise<string> => {
		return `https://storage.googleapis.com/${bucketName}/${objectName}?expires=${Date.now() + signedUrlTtl}`
	}

	return { uploadImage, signImageUrl }
}
