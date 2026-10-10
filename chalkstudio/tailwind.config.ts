/** @type {import('tailwindcss').Config} */
export default {
	theme: {
		extend: {
			colors: {
				board: {
					DEFAULT: 'rgb(var(--color-board) / <alpha-value>)',
					raised: 'rgb(var(--color-board-raised) / <alpha-value>)',
					frame: 'rgb(var(--color-board-frame) / <alpha-value>)',
				},
				chalk: {
					DEFAULT: 'rgb(var(--color-chalk) / <alpha-value>)',
					muted: 'rgb(var(--color-chalk-muted) / <alpha-value>)',
					faint: 'rgb(var(--color-chalk-faint) / <alpha-value>)',
				},
				coral: {
					DEFAULT: '#e85d4c',
					soft: '#ff6b5b',
				},
			},
			fontFamily: {
				display: ['Fraunces', 'Georgia', 'serif'],
				sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
			},
			maxWidth: {
				content: '72rem',
			},
		},
	},
}
