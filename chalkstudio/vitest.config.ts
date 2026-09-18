import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const alias = {
	'#shared': fileURLToPath(new URL('./shared', import.meta.url)),
}

export default defineConfig({
	test: {
		projects: [
			{
				resolve: { alias },
				test: {
					name: 'unit',
					include: ['test/unit/*'],
					environment: 'node',
				}
			},
			{
				resolve: { alias },
				test: {
					name: 'e2e',
					include: ['test/e2e/*'],
					environment: 'node',
				}
			},
		]
	}
})
