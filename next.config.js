/** @type {import('next').NextConfig} */
const nextConfig = {
  // undici 依赖 Node 原生绑定，被打包进 server bundle 会在构建期报
  // "Cannot read properties of undefined (reading 'bind')"，必须保持外部依赖
  serverExternalPackages: ['undici'],
  transpilePackages: ['lunar-javascript'],
  // 允许通过本机内网 IP 访问开发服务器（Next 16 默认只放行 localhost）
  allowedDevOrigins: ['10.1.23.111', '10.1.23.0'],
};

module.exports = nextConfig;
