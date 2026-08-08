import type Konva from 'konva'

export function useKonva() {
	const { $konva } = useNuxtApp()
	return $konva as typeof Konva
}
