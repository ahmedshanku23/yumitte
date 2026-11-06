const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const serverPath = path.join(root, 'server.js');
const target = path.join(root, 'routes', 'adminOverviewRoutes.js');
if (!fs.existsSync(target)) throw new Error('Copy routes/adminOverviewRoutes.js first');
const original = fs.readFileSync(serverPath, 'utf8');
if (original.includes("app.use('/api/admin', adminOverviewRoutes)")) {
  process.stdout.write('Admin overview route already installed.\n');
  process.exit(0);
}
if (!original.includes("const app = express();")) throw new Error('Could not find Express initialization; server.js unchanged');
const anchor = "const app = express();";
const imported = "const adminOverviewRoutes = require('./routes/adminOverviewRoutes');\n\n" + anchor;
const next = original.replace(anchor, imported);
if (!next.includes("app.use('/api/auth', authRoutes);")) throw new Error('Could not find API route block; server.js unchanged');
const updated = next.replace("app.use('/api/auth', authRoutes);", "app.use('/api/auth', authRoutes);\napp.use('/api/admin', adminOverviewRoutes);");
fs.writeFileSync(serverPath + '.before-admin-metrics.bak', original);
fs.writeFileSync(serverPath, updated);
process.stdout.write('Admin overview route installed; server backup created.\n');
