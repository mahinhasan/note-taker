# CareGuide API

A REST API for personal notes and public posts, with role-based access for `user` and `admin`. It is built with Node.js, Express 5, MongoDB and Mongoose.

## Requirements

- Node.js 18 or newer
- MongoDB 5.0 or newer. The `$lookup` in `GET /api/users/:id/posts` uses `localField`/`foreignField` together with a `pipeline`, which needs 5.0+. Tested on 8.0.

## Getting started

```bash
cd backend
npm install
cp .env.example .env          # then set JWT_SECRET to a random string of 32+ characters
npm run seed                  # creates the first admin from ADMIN_* values in .env (alias: seed:admin)
npm run dev                   # or: npm start
```

The server starts on `http://localhost:4000`. Express serves `./public` as static files, so opening the root URL shows a page that lists the endpoints.

To seed an admin without editing `.env`:

```bash
node scripts/seedAdmin.js --email=admin@example.com --password='a-strong-password' --name='Site Admin'
```

If a user with that email already exists, the script promotes them to admin and leaves their password unchanged. Running it again for an existing admin does nothing.

To check the query plans:

```bash
npm run explain
```

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MONGODB_URI` | yes | – | MongoDB connection string |
| `JWT_SECRET` | yes | – | HS256 signing secret (32 characters minimum) |
| `PORT` | no | `4000` | HTTP port |
| `NODE_ENV` | no | `development` | In development, 500 responses include a stack trace |
| `LOGIN_RATE_WINDOW_MS` | no | `900000` | Window for the login rate limit |
| `LOGIN_RATE_MAX` | no | `10` | Failed login attempts allowed per IP in each window |
| `TRUST_PROXY` | no | `0` | Number of proxy hops to trust, so the rate limiter sees the client IP |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | seed only | – | Used by `scripts/seedAdmin.js` |

## Project structure

```
backend/
├── public/                  static files served by Express
├── scripts/
│   ├── explain.js           runs explain('executionStats') on every query
│   └── seedAdmin.js         creates or promotes the first admin
└── src/
    ├── app.js               Express app: middleware, routes, error handling
    ├── server.js            connects to the DB, starts HTTP, shuts down cleanly
    ├── config/              env loading and validation, Mongo connection
    ├── models/              User, Note, Post schemas and indexes
    ├── middleware/          authenticate, authorize, validate, validators, rate limit, errors
    ├── routes/              URL → middleware chain → controller
    ├── controllers/         HTTP in/out only; call services, never the DB
    ├── services/            business rules, ownership checks, all DB access
    └── utils/               ApiError, cursor pagination, JWT, bcrypt helpers
```

Requests go **routes → controllers → services → models**. Controllers only read validated input (`req.valid`) and shape the response. Ownership and admin rules live in the services.

## Security

- **Passwords** are hashed with bcrypt at cost 12. `passwordHash` is `select: false`, and the `toJSON` transform removes it, so it never appears in a response. Passwords must be 8 characters to 72 bytes, because bcrypt ignores anything past 72 bytes.
- **JWT**: tokens are signed with HS256 and expire after 1 hour. They are sent as `Authorization: Bearer <token>`. Verification accepts only `HS256`.
- **`authenticate`** verifies the token and then loads the user by `_id` on every request. A token belonging to a deleted user is rejected with 401, and role changes take effect immediately.
- **`authorize(...roles)`** handles role checks for each route. Ownership is checked in the services:
  - Notes: a non-admin's queries always include `owner: <their id>`. Another user's note returns **404**, so the API does not reveal whether it exists.
  - Posts: anyone can read them, so a non-author who tries to change one gets **403**.
- **Registration** always creates `role: "user"`. Every write endpoint rejects unknown body fields, so a request cannot set `role` or `passwordHash` by sending extra fields.
- **Login** is rate limited per IP, and successful logins are not counted. Both an unknown email and a wrong password return the same `Invalid email or password` message. For an unknown email the service still runs a bcrypt comparison against a dummy hash, so response timing does not reveal which emails exist.
- **Validation**: express-validator checks every body, param and query value. Controllers use only `matchedData`, which is stored on `req.valid`.
- **Errors**: a single JSON error handler covers every error. Validation errors, malformed JSON, invalid ObjectIds, duplicate keys (409) and unknown routes all return `{ "error": { "status", "message", "details?" } }`.
- **Admin safety**: admins cannot delete their own account or remove their own admin role. Before an admin account is deleted, the service confirms through an indexed `_id` lookup that the requesting admin still exists, so at least one admin always remains.
- `helmet` sets the security headers, and JSON bodies are limited to 100 KB.

## Pagination

Every list endpoint uses a cursor on `_id`:

```
GET /api/notes?limit=20&after=<last _id from previous page>
→ { "data": [...], "nextCursor": "<_id>" | null }
```

- `limit` defaults to 20. Values above 100 are reduced to 100.
- Results are sorted by `_id` descending. `after` becomes `_id: { $lt: after }`.
- The service fetches `limit + 1` documents. If the extra document exists, there is a next page. This avoids `skip` and `countDocuments`.
- For `grouped-by-interests`, the cursor is the interest **name**, and groups are sorted alphabetically.

## Endpoints

All paths start with `/api`. Every endpoint except register and login requires a Bearer token.

### Auth

| Method | Path | Access | Body |
|---|---|---|---|
| POST | `/auth/register` | public | `name, email, password, interests?` |
| POST | `/auth/login` | public, rate limited | `email, password` |

Both return `{ data: { user, token } }`.

### Users

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/users/me` | user, admin | Current profile |
| PATCH | `/users/me` | user, admin | `name?, email?, interests?, password? + currentPassword` |
| GET | `/users` | admin | Paginated list |
| POST | `/users` | admin | `name, email, password, role?, interests?` |
| GET | `/users/grouped-by-interests` | admin | `?interest=&limit=&after=<interest>` |
| GET | `/users/:id` | admin | |
| PATCH | `/users/:id` | admin | `name?, email?, password?, role?, interests?` |
| DELETE | `/users/:id` | admin | Also deletes the user's notes and posts. Blocked for your own account and for the last admin |
| GET | `/users/:id/posts` | user, admin | `{ user: { _id, name, posts: [...] }, nextCursor }`, with `?limit=&after=` |

`grouped-by-interests` is registered before `/:id`, so Express does not treat it as an id.

### Notes

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/notes` | user: own only; admin: all | Admins can add `?owner=<userId>` |
| POST | `/notes` | user, admin | `title, content?` |
| GET | `/notes/:id` | owner or admin | |
| PATCH | `/notes/:id` | owner or admin | `title?, content?` |
| DELETE | `/notes/:id` | owner or admin | 204 |

### Posts

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/posts` | user, admin | All posts. Optional `?author=<userId>`. `author` is populated as `{ _id, name }` |
| POST | `/posts` | user, admin | `title, body` |
| GET | `/posts/:id` | user, admin | |
| PATCH | `/posts/:id` | author or admin | `title?, body?` |
| DELETE | `/posts/:id` | author or admin | 204 |

### Example

```bash
TOKEN=$(curl -s localhost:4000/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"change-me-please"}' | jq -r .data.token)

curl -s localhost:4000/api/notes -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"title":"First note","content":"Hello"}'

curl -s "localhost:4000/api/notes?limit=10" -H "authorization: Bearer $TOKEN"
```

## Aggregations

### `GET /api/users/grouped-by-interests`

This endpoint makes a single `User.aggregate()` call and runs no other queries:

```
$match   { interests: { $eq: <interest> } }  or  { interests: { $gte: "" } },  plus $gt: <after> when paging
$unwind  "$interests"
$match   same condition again, to drop the other interests of matched users
$group   { _id: "$interests", count: { $sum: 1 }, users: { $push: { _id, name } } }
$sort    { _id: 1 }
$limit   limit + 1
$project { interest: "$_id", count, users }
```

The first `$match` always has bounds on `interests`, so it uses the `interests_1` index:

- Without a filter, `$gte: ""` covers every string value.
- With `after`, the scan starts at that interest name.

The second `$match` is needed because the index finds whole user documents. A user with `["art", "music"]` matches `interest=music`, and after `$unwind` the `art` entry must be removed.

### `GET /api/users/:id/posts`

This endpoint runs one aggregation on `users`:

```
$match  { _id }
$lookup { from: "posts", localField: "_id", foreignField: "author",
          pipeline: [ $match { _id: { $lt: after } }, $sort { _id: -1 }, $limit limit + 1, $project ],
          as: "posts" }
$project { _id, name, posts }
```

The `foreignField` equality and the inner `_id` range and sort fit the `{ author: 1, _id: -1 }` index exactly. `explain.js` reports this as `indexesUsed: [author_1__id_-1]` with `collectionScans: 0`. If the user does not exist, the endpoint returns 404.

## Indexing strategy

Exactly four secondary indexes are created. Each is declared with `schema.index()` in its model file:

| Collection | Index | Queries served |
|---|---|---|
| users | `{ email: 1 }` unique | Login lookup. Enforces unique emails on register, admin create and email changes, which return 409 |
| users | `{ interests: 1 }` (multikey) | The first `$match` of `grouped-by-interests`, for an exact `?interest=`, for range scans with `after`, and for the full `$gte: ""` scan |
| notes | `{ owner: 1, _id: -1 }` | A user's own notes list. Admin `?owner=` list. Note get, update and delete scoped by owner. `Note.deleteMany({ owner })` when a user is deleted |
| posts | `{ author: 1, _id: -1 }` | The `$lookup` inner pipeline in `/users/:id/posts`. `/posts?author=`. `Post.deleteMany({ author })` when a user is deleted |

The built-in `_id` index covers everything else:

- `authenticate`: `findById`
- Get, update and delete by id for users, notes and posts
- Populating post authors: `User.find({ _id: { $in: authorIds } })`
- The admin last-admin check `{ _id, role }`
- Unfiltered lists of users, all notes (admin) and all posts. These are paginated on `_id` and sorted on `_id`, so walking the `_id` index backwards gives the order with no in-memory sort

The compound indexes put the equality field first and `_id` second. One index scan therefore gives both the filter and the `_id: -1` order, and the cursor (`_id < after`) is a tight range on the second key. Equality comes before sort and range, following the ESR rule.

### Indexes intentionally not created

| Not indexed | Reason |
|---|---|
| `users.role` | Only two values, so very low selectivity. No endpoint filters users by role. The last-admin check uses `_id` |
| `createdAt` (any collection) | ObjectIds increase over time, so sorting by `_id` gives creation order. An index on `createdAt` would duplicate `_id` |
| `notes.owner` / `posts.author` alone | Redundant. The compound index's leading field already serves equality-only queries |
| `users.name`, `title`, `content`, `body` | No endpoint filters or sorts on these fields. Text search is out of scope |
| `{ interests: 1, name: 1 }` or other covering indexes | The group stage needs `_id` and `name` from each document. A FETCH of matched documents is cheap compared with the cost of a wider multikey index |

### Proving there is no COLLSCAN

`scripts/explain.js` connects with the app's `.env` and ensures the four indexes exist. It prints every index present, then runs `explain('executionStats')` on every query the app issues:

- `find` calls
- `deleteMany` cascades, through the `explain` command, which does not change any data
- Both aggregations, including the `$lookup` statistics

For each query it prints the winning plan and the keys and documents examined. It exits with code 1 if any winning plan contains `COLLSCAN`. Sample output:

```
 OK   GET /api/notes (user: own notes)
      winning plan: LIMIT <- FETCH <- IXSCAN(owner_1__id_-1)
 OK   GET /api/users/grouped-by-interests (no filter)
      winning plan: PROJECTION_SIMPLE <- FETCH <- IXSCAN(interests_1)
 OK   GET /api/users/:id/posts (outer $match + $lookup)
      winning plan: EXPRESS_IXSCAN(_id_)
      $lookup: collectionScans=0 indexesUsed=[author_1__id_-1]
...
20/20 queries avoid COLLSCAN.
```

Run it on a database that has some data for realistic numbers. On an empty database it uses placeholder ids, and the plan shapes are the same.

## Known limitations

- Deleting a user and its cascade run as three separate writes, not a transaction, because a standalone MongoDB does not support transactions. The user is deleted first, so `authenticate` rejects that account's tokens immediately. The notes and posts are deleted after that.
- Tokens cannot be revoked before they expire. Deleting a user makes their tokens unusable because `authenticate` reloads the user on every request. A password change does not invalidate tokens that were already issued.
- If two admins try to delete each other at the same moment, both deletes could pass the last-admin check. Running `seedAdmin.js` again creates a new admin.
