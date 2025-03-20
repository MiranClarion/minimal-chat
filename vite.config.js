import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import VueDevTools from 'vite-plugin-vue-devtools';
import { VitePWA } from 'vite-plugin-pwa';
import viteImagemin from 'vite-plugin-imagemin';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import lightningcss from 'vite-plugin-lightningcss';


// Get the directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Recursive function to get all image files in a directory and its subdirectories
const getAllImageFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllImageFiles(filePath));
    } else {
      results.push(filePath);
    }
  });

  return results;
};

// Function to generate icons array from images directory
const generateIcons = async () => {
  const imagesDir = path.resolve(__dirname, 'public/images');
  const files = getAllImageFiles(imagesDir);
  const icons = await Promise.all(files
    // 只处理 png 和 jpg 格式的文件
    .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
    .map(async (file) => {
      try {
        const metadata = await sharp(file).metadata();
        const { width, height, format } = metadata;
        if (width === height && format === 'png') {
          const icon = {
            src: path.relative(path.resolve(__dirname, 'public'), file).replace(/\\/g, '/'),
            sizes: `${width}x${height}`,
            type: 'image/png'
          };
          if (file.includes('maskable')) {
            icon.purpose = 'maskable';
          }
          return icon;
        }
      } catch (error) {
        console.warn(`跳过非图像文件 ${file}`);
      }
    }));
  return icons.filter(Boolean);
};


const formatTagScreenshots = [
  {
    "src": "images/wide-minimal-chat.png",
    "sizes": "3832x2395",
    "type": "image/png",
    "form_factor": "wide",
    "label": "Desktop Homescreen of MinimalChat"
  },
  {
    "src": "images/narrow-minimal-chat.png",
    "sizes": "860x1864",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Mobile Homescreen of MinimalChat"
  }
];

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  optimizeDeps: {
    include: ['vue', 'vue-router', 'primevue', 'primeicons'],
    exclude: ['@mlc-ai/web-llm'], // 如果该依赖未预构建
    esbuildOptions: {
      target: 'es2022',
      logLevel: 'error',
    },
  },

  plugins: [
    // Vue 特定优化 静态提升
    vue({
      template: {
        // 启用静态提升，减少运行时开销
        compilerOptions: {
          hoistStatic: true,
          cacheHandlers: true
        }
      }
    }),

    lightningcss(),

    // 生产环境专属插件
    ...(mode === 'production'
      ? [
        viteImagemin({ // 图片压缩插件
          gifsicle: { optimizationLevel: 7, interlaced: false },
          optipng: { optimizationLevel: 7 },
          mozjpeg: { quality: 20 },
          pngquant: { quality: [0.65, 0.9], speed: 4 },
          svgo: {
            plugins: [
              { name: 'removeViewBox' },
              { name: 'removeEmptyAttrs', active: false }
            ]
          }
        })
      ]
      : []
    ),

    VueDevTools(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        maximumFileSizeToCacheInBytes: 8000000,
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,gif,webp,woff,woff2,eot,ttf,otf,json,xml}'],
        globIgnores: ['**/node_modules/**', '**/dist/**'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|eot|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.yourdomain\.com\/.*\.(json|xml)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-responses',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'MinimalChat',
        short_name: 'MinimalChat',
        description: 'A lightweight yet powerful LLM chat application',
        theme_color: '#202124',
        background_color: "#202124",
        icons: await generateIcons(),
        screenshots: formatTagScreenshots,
        edge_side_panel: {
          "preferred_width": 600
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'primevue': path.resolve(__dirname, 'node_modules/primevue'),
      'primeicons': path.resolve(__dirname, 'node_modules/primeicons')
    }
  },
  build: {
    // JS 压缩配置（保留原有 Terser 配置）
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        ecma: 2022, // 升级到更高 ECMAScript 版本
        // 开发环境禁用复杂压缩
        module: false,
        toplevel: false,
        passes: 3, // 减少压缩次数
      },
      mangle: false, // 禁用变量名混淆
      format: {
        comments: false
      }
    },

    // 基础构建配置
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 500, // 可删除，与默认值相同

    // CSS 相关配置
    cssCodeSplit: true, // 启用 CSS 分割
    // 无需设置 cssMinify，由 lightningcss 插件处理

    // 压缩和报告
    brotliSize: true,
    reportCompressedSize: false, // 移除冗余配置（需确保未安装其他插件）

    // 代码分割策略
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 先处理特定模块
          if (id.includes('src/libs/utils')) {
            return 'utils';
          }

          if (id.includes('src/libs/conversation-management')) {
            return 'conversation-mgmt';
          }

          // Vue 相关依赖
          if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router')) {
            return 'vue-vendor';
          }

          // UI 库相关依赖
          if (id.includes('node_modules/primevue') || id.includes('node_modules/primeicons')) {
            return 'ui-vendor';
          }

          // WebLLM 相关依赖
          if (id.includes('node_modules/@mlc-ai/web-llm')) {
            return 'web-llm';
          }

          // 其他 node_modules 依赖自动分组
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },

        // 自动处理依赖
        // manualChunks(id) {
        //   if (id.includes('node_modules')) {
        //     return id.toString().split('node_modules/')[1].split('/')[0].toString();
        //   }
        // },
      },

      // 启用 Rollup 缓存（减少重复构建时间）
      cache: {
        dir: path.resolve(__dirname, '.vite_cache')
      }
    }
  },

  server: {
    hmr: {
      overlay: false, // 隐藏错误弹窗（减少渲染开销）
      clientLogger: 'none', // 禁用 HMR 日志
    },
  },
}));
