const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'mock-data', 'data.json');

// Cache setup
let cachedData = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

// Middleware to load data
const loadData = async () => {
  if (!cachedData || (Date.now() - cacheTime) > CACHE_TTL) {
    cachedData = await fs.readJson(DATA_FILE);
    cacheTime = Date.now();
  }
  return cachedData;
};

// Routes
app.get('/users', authMiddleware, async (req, res) => {
  try {
    const data = await loadData();
    let users = data.users;

    // Search
    if (req.query.search) {
      const searchQuery = req.query.search.toLowerCase();
      users = users.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return (
          fullName.includes(searchQuery) ||
          (user.maidenName && user.maidenName.toLowerCase().includes(searchQuery))
        );
      });
    }

    // Sort
    if (req.query.sort) {
      const [key, order] = req.query.sort.split(',');
      users = users.sort((a, b) => {
        const aValue = a[key] || '';
        const bValue = b[key] || '';
        return order === 'desc'
          ? (bValue > aValue ? 1 : -1)
          : (aValue > bValue ? 1 : -1);
      });
    }

    // Filter
    if (req.query.filter) {
      const [key, value] = req.query.filter.split(',');
      users = users.filter(user => user[key] && user[key].toString() === value);
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      page,
      limit,
      total: users.length,
      users: paginatedUsers
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
