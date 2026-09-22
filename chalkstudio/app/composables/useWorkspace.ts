export function useWorkspace() {
	const initWorkspace = async () => {
		return await $fetch('/api/workspace/init', {
			method: 'GET',
		})
	}

	return {
		initWorkspace
	}

}
