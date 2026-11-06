const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        book_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL
      )
    `)

    const result = await db.get(
      'SELECT COUNT(*) AS count FROM book'
    )

    if (result.count === 0) {
      await db.run(
        'INSERT INTO book (title, author) VALUES (?, ?)',
        ['Harry Potter', 'J.K. Rowling']
      )

      await db.run(
        'INSERT INTO book (title, author) VALUES (?, ?)',
        ['The Hobbit', 'J.R.R. Tolkien']
      )

      await db.run(
        'INSERT INTO book (title, author) VALUES (?, ?)',
        ['Atomic Habits', 'James Clear']
      )
    }

    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

app.get('/books-vulnerable/:bookId/', async (request, response) => {
  const {bookId} = request.params

  const query = `
    SELECT * FROM book
    WHERE book_id = ${bookId}
  `

  const book = await db.get(query)

  response.send(book || {})
})

app.get('/books/:bookId/', async (request, response) => {
  const {bookId} = request.params

  const query = `
    SELECT * FROM book
    WHERE book_id = ?
  `

  const book = await db.get(query, [bookId])

  response.send(book || {})
})

app.post('/books/', async (request, response) => {
  const {title, author} = request.body

  const query = `
    INSERT INTO book (title, author)
    VALUES (?, ?)
  `

  await db.run(query, [title, author])

  response.send('Book Added Successfully')
})

app.put('/books/:bookId/', async (request, response) => {
  const {bookId} = request.params
  const {title, author} = request.body

  const query = `
    UPDATE book
    SET title = ?, author = ?
    WHERE book_id = ?
  `

  await db.run(query, [title, author, bookId])

  response.send('Book Updated Successfully')
})

app.delete('/books/:bookId/', async (request, response) => {
  const {bookId} = request.params

  const query = `
    DELETE FROM book
    WHERE book_id = ?
  `

  await db.run(query, [bookId])

  response.send('Book Deleted Successfully')
})

initializeDBAndServer()

module.exports = app