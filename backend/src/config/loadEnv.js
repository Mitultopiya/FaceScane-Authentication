import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Always load backend/.env (works no matter which script you run)
dotenv.config({ path: path.join(__dirname, '../../.env') });
