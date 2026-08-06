/** @type {import('tailwindcss').Config} */
export default {
	theme: {
		extend: {
			colors: {
				board: {
					DEFAULT: '#1a2332',
					raised: '#243044',
					frame: '#2f3d52',
				},
				chalk: {
					DEFAULT: '#f5f0e8',
					muted: '#c4bfb4',
					faint: '#9ba8b8',
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
