/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lunar-javascript'],
  // 允许通过本机内网 IP 访问开发服务器（Next 16 默认只放行 localhost）
  allowedDevOrigins: ['10.1.23.111', '10.1.23.0'],
};

module.exports = nextConfig;
