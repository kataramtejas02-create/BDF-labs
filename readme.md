# Goodreads API – SQL Injection and Parameterized Queries

## Overview

This project demonstrates SQL Injection and how Parameterized Queries help prevent it using Node.js, Express.js, and SQLite.

It includes a deliberately vulnerable API endpoint and a secure endpoint using parameterized queries.

## Technologies Used

- Node.js
- Express.js
- SQLite
- JavaScript
- Nodemon

## Project Structure

```text
BDF SL/
├── app.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Navigate into the project folder:

```bash
cd "BDF SL"
```

Install dependencies:

```bash
npm install
```

## Running the Server

Start the development server:

```bash
npm run dev
```

The server runs at:

```text
http://localhost:3000/
```

The SQLite database is created automatically when the server starts.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/books-vulnerable/:bookId/` | Demonstrates a vulnerable SQL query |
| GET | `/books/:bookId/` | Retrieves a book using a parameterized query |
| POST | `/books/` | Adds a new book |
| PUT | `/books/:bookId/` | Updates an existing book |
| DELETE | `/books/:bookId/` | Deletes a book |

## SQL Injection

SQL Injection is a security vulnerability where specially crafted user input can manipulate an SQL query.

The vulnerable endpoint directly inserts user input into the SQL query:

```js
const query = `
  SELECT * FROM book
  WHERE book_id = ${bookId}
`
```

An example input is:

```text
1 OR 1=1
```

This changes the intended SQL condition.

## Parameterized Queries

Parameterized Queries help prevent SQL Injection by separating SQL commands from user-provided values.

The secure endpoint uses a placeholder:

```js
const query = `
  SELECT * FROM book
  WHERE book_id = ?
`

const book = await db.get(query, [bookId])
```

The database treats the supplied input as a value rather than executable SQL code.

## SQLite Methods Used

- `get()` – Retrieves a single record from the database.
- `run()` – Executes INSERT, UPDATE, and DELETE queries.

## Conclusion

This project demonstrates how SQL Injection can affect database security and how Parameterized Queries help protect applications from such attacks.
