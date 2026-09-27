import bcrypt from 'bcryptjs';
import db from './db';

const hash = bcrypt.hashSync('Admin@123', 10);
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@example.com');
if (!existing) db.prepare('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)').run('Admin User','admin@example.com',hash);
const count = (db.prepare('SELECT COUNT(*) as count FROM records').get() as {count:number}).count;
if (count === 0) {
  const insert = db.prepare('INSERT INTO records (name,email,role,status) VALUES (?,?,?,?)');
  const seed = db.transaction(() => {
    insert.run('Arun Kumar','arun@example.com','Developer','Active');
    insert.run('Priya Sharma','priya@example.com','Designer','Active');
    insert.run('Rahul Das','rahul@example.com','Manager','Inactive');
  });
  seed();
}
console.log('Seed complete. Login: admin@example.com / Admin@123');
