'use strict';

const fs = require('node:fs');
const path = require('node:path');
const file = path.join(process.cwd(), 'routes', 'authRoutes.js');
const oldCode = "if (!users.length) return res.json({ success: true, message: GENERIC_RESET_NOTICE });";
const newCode = "if (!users.length) return res.status(404).json({ success: false, message: 'This email is not registered.' });";
if (!fs.existsSync(file)) {
  console.error('Cannot find routes/authRoutes.js. Run this script from the yumio-backend folder.');
  process.exit(1);
}
const source = fs.readFileSync(file, 'utf8');
if (source.includes(newCode)) {
  console.log('The unregistered-email fix is already installed.');
  process.exit(0);
}
if (source.split(oldCode).length !== 2) {
  console.error('Expected password-reset check not found exactly once. No files changed.');
  process.exit(1);
}
if (!source.includes("router.post('/password-reset/request'")) {
  console.error('Password reset request endpoint not found. No files changed.');
  process.exit(1);
}
const backup = file + '.before-unregistered-email-fix.bak';
if (fs.existsSync(backup)) {
  console.error('Backup already exists. No files changed: ' + backup);
  process.exit(1);
}
fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
fs.writeFileSync(file, source.replace(oldCode, newCode), 'utf8');
console.log('Updated routes/authRoutes.js. Original backed up at:');
console.log(backup);
console.log('Restart the Yumio server, then test a nonregistered email.');
