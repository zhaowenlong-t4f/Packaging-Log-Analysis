/**
 * 环境变量配置
 */

interface EnvConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  maxLogSize: number;
  maxUploadSize: number;
  tempDir: string;
  logLevel: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
}

export const env: EnvConfig = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3000),
  databaseUrl: getEnvVar('DATABASE_URL', 'file:./data/app.db'),
  maxLogSize: getEnvNumber('MAX_LOG_SIZE', 524288000), // 500MB
  maxUploadSize: getEnvNumber('MAX_UPLOAD_SIZE', 524288000), // 500MB
  tempDir: getEnvVar('TEMP_DIR', './data/temp'),
  logLevel: getEnvVar('LOG_LEVEL', 'info'),
};

