# TransferMarket Module

转会市场模块 - 用于生成和管理转会申请，并生成与预算模块兼容的转会记录。

## 项目结构

```
TransferMarket/
├── backend/              # Node.js/Express 后端
│   ├── src/
│   │   ├── server.js     # Express 服务器
│   │   ├── routes/       # API 路由
│   │   ├── db/          # 数据库连接和迁移
│   │   ├── middleware/   # 认证中间件
│   │   └── utils/       # 工具函数
│   └── package.json
├── frontend-visitor/     # 访客前端（GitHub Pages）
├── frontend-editor/      # 编辑前端（GitHub Pages）
└── .github/workflows/    # GitHub Actions 部署配置
```

## 功能特性

### 访客网站
- 提交转会申请（支持多个申请）
- 查看转会历史（只读）
- 重复检查提醒

### 编辑网站
- 密码登录（与预算模块共享密码）
- 查看和管理转会申请
- 批准/拒绝申请
- 编辑申请和历史记录
- 归档历史记录
- 清空历史记录
- 导出历史记录为 CSV

## 快速开始

### 本地开发

#### 后端

```bash
cd backend
npm install
npm run dev
```

需要设置环境变量：
- `DATABASE_URL`: PostgreSQL 数据库连接字符串（与预算模块共享）
- `JWT_SECRET`: JWT 密钥（建议与预算模块相同）
- `CORS_ORIGINS`: 允许的 CORS 来源（逗号分隔）

#### 前端

```bash
# 访客前端
cd frontend-visitor
npm install
npm run dev

# 编辑前端
cd frontend-editor
npm install
npm run dev
```

需要设置环境变量（创建 `.env` 文件）：
- `VITE_API_BASE`: 后端 API 基础 URL
- `VITE_BASE_PATH`: GitHub Pages 基础路径（如 `/TransferMarket/`）

## 部署

详细部署说明请参考 [DEPLOYMENT_MANUAL.md](DEPLOYMENT_MANUAL.md)。

### 后端部署（Railway）

1. 在现有 Railway 项目中添加新服务
2. 连接到 GitHub 仓库
3. 设置根目录为 `backend/`
4. 配置环境变量（共享数据库）

### 前端部署（GitHub Pages）

1. 推送到 GitHub 仓库
2. GitHub Actions 自动构建和部署
3. 配置 GitHub Pages 使用 `gh-pages` 分支

## 数据库

使用 `tm_` 前缀的表以避免与预算模块冲突：
- `tm_transfer_applications`: 转会申请
- `tm_transfer_history`: 转会历史

共享 `config` 表用于密码认证。

## 许可证

MIT

