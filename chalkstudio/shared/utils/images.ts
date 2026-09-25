export const SUPPORTED_IMAGE_TYPES: readonly string[] = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

export const isSupportedImageType = (type: string): boolean => SUPPORTED_IMAGE_TYPES.includes(type)
