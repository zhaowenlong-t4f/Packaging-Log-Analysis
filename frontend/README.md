# Unity 日志分析系统 - 前端

## 技术栈

- React 18+ + TypeScript
- Redux Toolkit (状态管理)
- Ant Design 5.0 (UI组件库)
- React Router 6.0 (路由)
- Axios (HTTP客户端)
- Vite (构建工具)
- Monaco Editor (代码编辑器)

## 一键部署

### 使用 PowerShell 脚本（推荐）

```powershell
# 完整部署（安装依赖 + 构建 + 预览）
.\deploy.ps1

# 构建后启动预览服务器
.\deploy.ps1 -Preview

# 跳过依赖安装
.\deploy.ps1 -SkipInstall

# 跳过构建（仅启动开发服务器）
.\deploy.ps1 -SkipBuild

# 生产模式构建
.\deploy.ps1 -Production
```

### 使用批处理脚本

直接双击 `deploy.bat` 文件，或在命令行运行：

```cmd
deploy.bat
```

### 手动部署

如果脚本无法运行，可以手动执行以下步骤：

```bash
# 1. 安装依赖
npm install

# 2. 构建生产版本
npm run build

# 3. 预览构建结果
npm run preview

# 或启动开发服务器
npm run dev
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

## 项目结构

```
src/
├── components/          # 组件
│   ├── LogAnalysis/    # 日志分析相关组件
│   ├── RuleManagement/ # 规则管理相关组件
│   ├── Common/         # 公共组件
│   └── Layout/          # 布局组件
├── pages/              # 页面
├── services/           # 服务层
│   ├── api/           # API调用
│   └── utils/         # 工具函数
├── store/              # Redux状态管理
├── types/              # TypeScript类型定义
├── styles/             # 样式文件
└── config/             # 配置文件
```

## 环境变量

创建 `.env` 文件：

```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## 内网访问配置

### 1. 获取本机 IP 地址

**Windows:**
```bash
ipconfig
```
查找 "IPv4 地址"，例如：`192.168.1.100`

**Linux/Mac:**
```bash
ifconfig
# 或
ip addr
```

### 2. 配置前端环境变量

在 `frontend` 目录下创建 `.env` 文件（如果不存在），设置后端 API 地址：

```env
# 将 <your-ip> 替换为你的实际 IP 地址
VITE_API_BASE_URL=http://<your-ip>:3000/api/v1
```

例如，如果你的 IP 是 `192.168.1.100`：
```env
VITE_API_BASE_URL=http://192.168.1.100:3000/api/v1
```

### 3. 启动服务

**启动后端服务：**
```bash
cd backend
npm run dev
```

**启动前端服务：**
```bash
cd frontend
npm run dev
```

### 4. 访问应用

在其他内网计算机的浏览器中访问：
```
http://<your-ip>:5173
```

例如：`http://192.168.1.100:5173`

### 注意事项

1. **防火墙设置**：确保 Windows 防火墙允许端口 5173（前端）和 3000（后端）的入站连接
2. **网络连接**：确保所有设备在同一局域网内
3. **IP 地址变化**：如果使用 DHCP，IP 地址可能会变化，需要重新配置

