import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
export default defineConfig({
 plugins: [react()],
 resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
 },
 // 如果你需要指定构建输出的基础路径，可以使用 base 选项
 base: '/',
 // 如果你希望服务静态文件，可以使用 publicDir 选项
 publicDir: './public',
})
