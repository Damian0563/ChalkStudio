// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	devServer: {
		port: 3000,
	},
	modules: ['@nuxtjs/tailwindcss', 'motion-v/nuxt', '@nuxt/icon', '@vueuse/nuxt'],
	nitro: {
		experimental: {
			websocket: true
		}
	},
	tailwindcss: {
		cssPath: '~/assets/css/main.css',
		configPath: 'tailwind.config.ts',
	},
	icon: {
		clientBundle: {
			scan: true,
		},
	},
	build: {
		transpile: ['vue-konva'],
	},
	vite: {
		resolve: {
			dedupe: ['konva'],
		},
		optimizeDeps: {
			include: ['konva', 'vue-konva'],
		},
	},
	app: {
		head: {
			title: 'ChalkStudio',
			htmlAttrs: { lang: 'en' },
			charset: 'utf-8',
			viewport: 'width=device-width, initial-scale=1',
			link: [
				{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
				{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
				{
					rel: 'stylesheet',
					href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Source+Sans+3:wght@400;500;600&display=swap',
				},
				{
					rel: 'icon',
					type: 'image/x-icon',
					href: '/favicon.ico',
				}
			],
		},
	},
})
