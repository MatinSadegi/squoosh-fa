import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import image from '@rollup/plugin-image'; // ۱. پلاگین جدید برای تصاویر اضافه شد

export default {
  // ۲. نقطه ورود به حالت اولیه پروژه برگردانده شد
  input: 'src/static-build/index.tsx',
  output: {
    file: 'public/bundle.js',
    format: 'iife', // فرمت مناسب برای اجرا در مرورگر
    sourcemap: true,
  },
  plugins: [
    // ۳. پلاگین تصویر در ابتدای لیست قرار گرفت تا فایل‌های تصویری را پردازش کند
    image(),
    resolve({
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      inlineSources: true,
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    serve({
      contentBase: 'public',
      open: true,
      port: 3000,
    }),
    livereload('public'),
  ],
};
