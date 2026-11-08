const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "books.db");

app.use(express.json());

const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL NOT NULL
    )
  `);
}

function validateBook(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "A JSON request body is required.";
  }
  if (typeof body.title !== "string" || body.title.trim() === "") {
    return "Title is required and must be a non-empty string.";
  }
  if (typeof body.author !== "string" || body.author.trim() === "") {
    return "Author is required and must be a non-empty string.";
  }
  if (body.price === undefined || body.price === null || body.price === "" ||
      !Number.isFinite(Number(body.price))) {
    return "Price is required and must be a number.";
  }
  if (Number(body.price) < 0) {
    return "Price cannot be negative.";
  }
  return null;
}

function isValidId(id) {
  return Number.isInteger(Number(id)) && Number(id) > 0;
}

app.get("/", (req, res) => {
  res.status(200).json({ message: "Book Management API is running." });
});

app.get("/books", async (req, res, next) => {
  try {
    const searchQ = typeof req.query.search_q === "string" ? req.query.search_q.trim() : "";
    const orderBy = req.query.order_by || "title";
    const order = String(req.query.order || "ASC").toUpperCase();
    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
    const minPrice = req.query.min_price === undefined ? null : Number(req.query.min_price);
    const maxPrice = req.query.max_price === undefined ? null : Number(req.query.max_price);

    const allowedColumns = {
      id: "id",
      title: "title",
      author: "author",
      price: "price"
    };

    if (!Object.prototype.hasOwnProperty.call(allowedColumns, orderBy)) {
      return res.status(400).json({ message: "Invalid order_by. Use id, title, author or price." });
    }
    if (!["ASC", "DESC"].includes(order)) {
      return res.status(400).json({ message: "Invalid order. Use ASC or DESC." });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ message: "Limit must be an integer between 1 and 100." });
    }
    if (!Number.isInteger(offset) || offset < 0) {
      return res.status(400).json({ message: "Offset must be a non-negative integer." });
    }
    if (minPrice !== null && (!Number.isFinite(minPrice) || minPrice < 0)) {
      return res.status(400).json({ message: "min_price must be a non-negative number." });
    }
    if (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0)) {
      return res.status(400).json({ message: "max_price must be a non-negative number." });
    }
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return res.status(400).json({ message: "min_price cannot be greater than max_price." });
    }

    const conditions = [];
    const params = [];

    if (searchQ) {
      conditions.push("title LIKE ?");
      params.push(`%${searchQ}%`);
    }
    if (minPrice !== null) {
      conditions.push("price >= ?");
      params.push(minPrice);
    }
    if (maxPrice !== null) {
      conditions.push("price <= ?");
      params.push(maxPrice);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT id, title, author, price
      FROM books
      ${where}
      ORDER BY ${allowedColumns[orderBy]} ${order}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const books = await all(sql, params);
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
});

app.get("/books/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Book id must be a positive integer." });
    }

    const book = await get(
      "SELECT id, title, author, price FROM books WHERE id = ?",
      [Number(req.params.id)]
    );

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
});

app.post("/books", async (req, res, next) => {
  try {
    const validationError = validateBook(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const result = await run(
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
      [req.body.title.trim(), req.body.author.trim(), Number(req.body.price)]
    );

    const book = await get(
      "SELECT id, title, author, price FROM books WHERE id = ?",
      [result.lastID]
    );

    res.status(201).json({ message: "Book created successfully.", book });
  } catch (error) {
    next(error);
  }
});

app.put("/books/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Book id must be a positive integer." });
    }

    const validationError = validateBook(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingBook = await get(
      "SELECT id FROM books WHERE id = ?",
      [Number(req.params.id)]
    );

    if (!existingBook) {
      return res.status(404).json({ message: "Book not found." });
    }

    await run(
      "UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?",
      [req.body.title.trim(), req.body.author.trim(), Number(req.body.price), Number(req.params.id)]
    );

    const book = await get(
      "SELECT id, title, author, price FROM books WHERE id = ?",
      [Number(req.params.id)]
    );

    res.status(200).json({ message: "Book updated successfully.", book });
  } catch (error) {
    next(error);
  }
});

app.delete("/books/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Book id must be a positive integer." });
    }

    const result = await run("DELETE FROM books WHERE id = ?", [Number(req.params.id)]);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Book not found." });
    }

    res.status(200).json({ message: "Book deleted successfully." });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error(error.message);
  res.status(500).json({ message: "Internal server error." });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Book Management API running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error.message);
    process.exit(1);
  });

module.exports = app;
