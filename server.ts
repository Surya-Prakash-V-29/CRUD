import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from './db';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

type AuthRequest = Request & { userId?: number };
const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try { req.userId = (jwt.verify(token, JWT_SECRET) as { userId: number }).userId; next(); }
  catch { return res.status(401).json({ message: 'Invalid or expired token' }); }
};

const credentials = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(6).max(100) });
const recordSchema = z.object({ name: z.string().min(2).max(100), email: z.string().email(), role: z.string().min(2).max(60), status: z.enum(['Active','Inactive']) });

app.get('/api/health', (_req,res) => res.json({ status:'ok' }));

app.post('/api/auth/register', async (req,res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message:'Invalid input', errors: parsed.error.flatten() });
  const { name,email,password } = parsed.data;
  try {
    const hash = await bcrypt.hash(password,10);
    const result = db.prepare('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)').run(name,email.toLowerCase(),hash);
    const token = jwt.sign({ userId:Number(result.lastInsertRowid) }, JWT_SECRET, { expiresIn:'1d' });
    res.status(201).json({ token, user:{ id:Number(result.lastInsertRowid),name,email:email.toLowerCase() } });
  } catch { res.status(409).json({ message:'Email already registered' }); }
});

app.post('/api/auth/login', async (req,res) => {
  const parsed = z.object({ email:z.string().email(), password:z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message:'Enter a valid email and password' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email.toLowerCase()) as any;
  if (!user || !(await bcrypt.compare(parsed.data.password,user.password_hash))) return res.status(401).json({ message:'Invalid email or password' });
  const token = jwt.sign({ userId:user.id }, JWT_SECRET, { expiresIn:'1d' });
  res.json({ token, user:{ id:user.id,name:user.name,email:user.email } });
});

app.get('/api/auth/me', auth, (req:AuthRequest,res) => {
  const user = db.prepare('SELECT id,name,email,created_at FROM users WHERE id=?').get(req.userId);
  if (!user) return res.status(404).json({message:'User not found'});
  res.json({user});
});

app.get('/api/records', auth, (req,res) => {
  const q = String(req.query.search || '').trim();
  const rows = q ? db.prepare("SELECT * FROM records WHERE name LIKE ? OR email LIKE ? OR role LIKE ? ORDER BY id DESC").all(`%${q}%`,`%${q}%`,`%${q}%`) : db.prepare('SELECT * FROM records ORDER BY id DESC').all();
  res.json({ records: rows });
});

app.post('/api/records', auth, (req,res) => {
  const parsed = recordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({message:'Invalid record', errors:parsed.error.flatten()});
  const {name,email,role,status}=parsed.data;
  const result = db.prepare('INSERT INTO records (name,email,role,status) VALUES (?,?,?,?)').run(name,email,role,status);
  const record = db.prepare('SELECT * FROM records WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json({record});
});

app.put('/api/records/:id', auth, (req,res) => {
  const parsed = recordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({message:'Invalid record', errors:parsed.error.flatten()});
  const {name,email,role,status}=parsed.data;
  const result = db.prepare("UPDATE records SET name=?,email=?,role=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(name,email,role,status,Number(req.params.id));
  if (!result.changes) return res.status(404).json({message:'Record not found'});
  res.json({record:db.prepare('SELECT * FROM records WHERE id=?').get(Number(req.params.id))});
});

app.delete('/api/records/:id', auth, (req,res) => {
  const result = db.prepare('DELETE FROM records WHERE id=?').run(Number(req.params.id));
  if (!result.changes) return res.status(404).json({message:'Record not found'});
  res.json({message:'Record deleted'});
});

app.use((_req,res) => res.status(404).json({message:'Route not found'}));
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
