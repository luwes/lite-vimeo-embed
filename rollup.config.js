import resolve from 'rollup-plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import babel from 'rollup-plugin-babel';
import {
    terser
} from 'rollup-plugin-terser';
import bundleSize from 'rollup-plugin-size';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';
import cssnano from 'cssnano';

const production = !process.env.ROLLUP_WATCH;

const terserPlugin = terser({
    sourcemap: true,
    warnings: true,
    compress: {
        passes: 2
    },
    mangle: {
        properties: {
            regex: /^_/
        }
    }
});

const config = {
    input: 'src/lite-vimeo-embed.js',
    output: {
        sourcemap: true,
        format: 'iife',
        name: 'ltv',
        file: 'dist/lite-vimeo-embed.js'
    },
    plugins: [
        bundleSize(),
        resolve(),
        postcss({
            extensions: ['.css'],
            plugins: [
                cssnano()
            ]
        }),

        // If we're building for production (npm run build
        // instead of npm run dev), minify
        production && terserPlugin
    ],
    watch: {
        clearScreen: false
    }
};

export default [{
    ...config,
    output: {
        ...config.output,
        file: 'module/lite-vimeo-embed.js',
        format: 'es'
    },
    plugins: [
        ...config.plugins,

        copy({
            targets: [{ src: 'dist', dest: 'public' }]
        }),
    ]
}, {
    ...config,
    output: {
        ...config.output,
        file: 'dist/lite-vimeo-embed.js',
        format: 'umd'
    },
    plugins: [
        ...config.plugins,
        babel(),

        // In dev mode, call `npm run start` once
        // the bundle has been generated
        !production && serve(),

        // Watch the `public` directory and refresh the
        // browser on changes when not in production
        !production && livereload('./')
    ]
}, ];

function serve() {
    let started = false;

    return {
        writeBundle() {
            if (!started) {
                started = true;

                require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
                    stdio: ['ignore', 'inherit', 'inherit'],
                    shell: true
                });
            }
        }
    };
}
