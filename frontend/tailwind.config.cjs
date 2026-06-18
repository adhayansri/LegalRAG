module.exports = {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: '#22d3ee',
                surface: '#071025',
                glass: 'rgba(255,255,255,0.04)'
            },
            fontFamily: {
                inter: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'Noto Sans', 'sans-serif'],
            },
            borderRadius: {
                xl: '14px'
            }
        },
    },
    plugins: [],
}
