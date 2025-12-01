import express from 'express';
import multer from 'multer';
import { analyzeLog } from '../controllers/logController';
import { validate } from '../middleware/validate';
import { analyzeLogSchema } from '../schemas';

const router = express.Router();

// 配置 multer 用于文件上传
const upload = multer({
  limits: {
    fileSize: parseInt(process.env['MAX_LOG_SIZE'] || '524288000') // 500MB
  },
  dest: process.env['TEMP_DIR'] || './data/temp'
});

// 分析日志
router.post('/analyze', upload.single('file'), validate(analyzeLogSchema), analyzeLog);

export default router;
