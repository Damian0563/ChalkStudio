type useWorkspaceOptions = {
	fetch: ReturnType<typeof useRequestFetch>
}

export function useWorkspace(options: useWorkspaceOptions) {
	const initWorkspace = async () => {
		return await options.fetch('/api/workspace/init', {
			method: 'GET',
		})
	}

	return {
		initWorkspace
	}

}
