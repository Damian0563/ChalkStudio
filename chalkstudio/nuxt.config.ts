import type { NitroRouteConfig } from 'nitropack'

export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	devServer: {
		port: 3000,
	},
	modules: [
		'@nuxtjs/tailwindcss',
		'motion-v/nuxt',
		'@nuxt/icon',
		'@nuxt/fonts',
		'@vueuse/nuxt',
		'@nuxt/test-utils/module',
		'nuxt-csurf',
		'nuxt-vue3-google-signin',
	],
	googleSignIn: {
		clientId: process.env.GOOGLE_CLIENT_ID,
	},
	fonts: {
		families: [
			{ name: 'Caveat', provider: 'google', weights: [400, 500, 600, 700], styles: ['normal'], global: true },
			{
				name: 'Fraunces',
				provider: 'google',
				weights: [300, 400, 500, 600, 700, 800],
				styles: ['normal'],
				global: true,
				providerOptions: { google: { experimental: { variableAxis: { opsz: [['9', '144']] } } } },
			},
			{ name: 'Source Sans 3', provider: 'google', weights: [300, 400, 500, 600, 700, 800], styles: ['normal'], global: true },
		],
	},
	csurf: {
		methodsToProtect: ['POST', 'PUT', 'PATCH', 'DELETE'],
	},
	routeRules: {
		'/api/tasks/**': { csurf: false } as NitroRouteConfig,
	},
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
				{
					rel: 'icon',
					type: 'image/x-icon',
					href: '/favicon.ico',
				}
			],
		},
	},
})
