# Lab 3: REST API, query parameters, validation, debugging

**Name:** TEJAS KATARAM 
**Registration number:** 252U1R9064 
**Section:** CSE GEN-AI 2A 304 S-024  

**Live link:** Not deployed yet

## How to run

1. Install Node.js.
2. Open this folder in VS Code.
3. Run `npm install` in the terminal.
4. Optionally create a `.env` file using `.env.example` as a reference. Default port: `3000`.
5. Run `npm start`.
6. Open `http://localhost:3000`.

For automatic restart during development, run `npm run dev`.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Check whether the API is running |
| GET | `/books` | List books with search, sorting, pagination and price filters |
| GET | `/books/:id` | Get a book by ID |
| POST | `/books` | Create a book |
| PUT | `/books/:id` | Update a book |
| DELETE | `/books/:id` | Delete a book |

## GET /books query parameters

| Parameter | Default | Description |
|---|---|---|
| `search_q` | Empty | Partial title search |
| `order_by` | `title` | `id`, `title`, `author` or `price` |
| `order` | `ASC` | `ASC` or `DESC` |
| `limit` | `10` | Number of results (1–100) |
| `offset` | `0` | Number of records to skip |
| `min_price` | Not applied | Minimum price |
| `max_price` | Not applied | Maximum price |

Example:
`http://localhost:3000/books?search_q=harry&order_by=price&order=DESC&limit=5&offset=0&min_price=100&max_price=1000`

## POST /books request body

```json
{
  "title": "The Hobbit",
  "author": "J.R.R. Tolkien",
  "price": 450
}
```

Use the same fields for `PUT /books/:id`.

## Postman test list

1. `GET /` — expect 200.
2. `GET /books` — expect 200.
3. `POST /books` with valid JSON — expect 201.
4. `GET /books/1` — expect 200 if ID 1 exists.
5. `GET /books?search_q=the` — expect 200.
6. `GET /books?order_by=price&order=DESC` — expect 200.
7. `GET /books?limit=5&offset=0` — expect 200.
8. `GET /books?min_price=100&max_price=500` — expect 200.
9. `POST /books` with missing title, author or invalid price — expect 400.
10. `GET /books/999999` — expect 404 if that ID does not exist.
11. `PUT /books/1` with valid JSON — expect 200 if ID 1 exists.
12. `DELETE /books/1` — expect 200 if ID 1 exists.
13. `GET /books?order_by=password` — expect 400.
14. `GET /books?order=SIDEWAYS` — expect 400.
15. `GET /books?min_price=900&max_price=100` — expect 400.

## Screenshots

Save your Postman screenshots in this folder and add them below.

![Successful book creation](screenshots/post-book-success.png)

![Book search](screenshots/book-search.png)

![Validation error](screenshots/post-book-validation-error.png)

![Book not found](screenshots/book-not-found.png)

## Notes: problems faced and how they were solved

Add the actual problems you encountered and how you solved them.

## Implementation notes

- The database and `books` table are created automatically when the server starts.
- SQL values use parameterized placeholders (`?`).
- Sort columns and sort direction are validated before being included in the query.
- Do not commit `.env`, `node_modules` or the generated database file.
