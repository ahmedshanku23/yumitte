
const express = require('express');
const pool = require('../config/db');

const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');

router.get('/schedules', async (req, res) => {
  try { const [rows] = await pool.query('SELECT category, start_time, end_time, is_all_day, is_active FROM menu_schedules ORDER BY schedule_id'); res.json({ success: true, data: rows }); }
  catch (error) { console.error('Schedule API error:', error.message); res.status(500).json({ success: false, message: 'Unable to retrieve serving hours' }); }
});

router.get('/', async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT item_id, item_name, description,
             category, price, is_available, image_url
      FROM menu_items
      WHERE is_available = 1
      ORDER BY category, item_name
    `);

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Menu API error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve menu items'
    });
  }
});



router.get('/admin/items', requireRole('admin'), async (_req, res) => {
  try {
    const [data] = await pool.execute('SELECT item_id, item_name, description, category, price, is_available, image_url FROM menu_items ORDER BY category, item_name');
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin menu read error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to retrieve menu management items' });
  }
});
const menuCategories = new Set(['Breakfast', 'Lunch', 'Supper', 'Dinner', 'Drinks', 'Desserts']);
function menuInput(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const category = body?.category;
  const price = Number(body?.price);
  const image = typeof body?.image_url === 'string' ? body.image_url.trim() : '';
  if (!name || name.length > 150 || description.length > 5000 || !menuCategories.has(category) || !Number.isFinite(price) || price <= 0 || price > 100000 || image.length > 500 || (image && !/^\/images\/menu\/[a-z0-9_./-]+$/i.test(image))) return null;
  return { name, description, category, price: price.toFixed(2), image };
}
router.post('/admin/items', requireRole('admin'), async (req, res) => {
  const item = menuInput(req.body);
  if (!item) return res.status(400).json({ success: false, message: 'Enter a valid name, category and price' });
  try {
    const [result] = await pool.execute('INSERT INTO menu_items (item_name, description, category, price, is_available, image_url) VALUES (?, ?, ?, ?, 1, ?)', [item.name, item.description, item.category, item.price, item.image || null]);
    res.status(201).json({ success: true, item_id: result.insertId });
  } catch (error) {
    console.error('Admin menu create error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to create menu item' });
  }
});
router.patch('/admin/items/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const item = menuInput(req.body);
  if (!Number.isSafeInteger(id) || id <= 0 || !item) return res.status(400).json({ success: false, message: 'Invalid menu item information' });
  try {
    const [result] = await pool.execute('UPDATE menu_items SET item_name=?, description=?, category=?, price=? WHERE item_id=?', [item.name, item.description, item.category, item.price, id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin menu update error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to update menu item' });
  }
});
router.patch('/admin/items/:id/availability', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0 || typeof req.body?.available !== 'boolean') return res.status(400).json({ success: false, message: 'Invalid menu availability' });
  try {
    const [result] = await pool.execute('UPDATE menu_items SET is_available=? WHERE item_id=?', [req.body.available ? 1 : 0, id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin menu availability error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to update menu availability' });
  }
});
router.delete('/admin/items/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid menu item ID' });
  try {
    const [result] = await pool.execute('UPDATE menu_items SET is_available=0 WHERE item_id=?', [id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.json({ success: true, message: 'Item archived from the customer menu' });
  } catch (error) {
    console.error('Admin menu archive error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to archive menu item' });
  }
});

module.exports = router;
