# CareGuide Web

A React frontend (Vite, plain JavaScript) for the CareGuide REST API in `../backend`. All components and styles are written by hand. The only dependencies are React and `react-router-dom`, with no UI library, CSS framework or icon package.

## Run

Start the backend first. It listens on port 4000, as described in `../backend/README.md`:

```bash
cd backend
npm install
cp .env.example .env        # set JWT_SECRET
npm run seed
npm run dev
```

Then, in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

The frontend needs no environment variables. The Vite dev server proxies every `/api` request to `http://localhost:4000` (see `vite.config.js`), so the browser only talks to its own origin and CORS never comes into play.

If the API runs somewhere else, set `API_PROXY_TARGET` when starting the dev server, for example `API_PROXY_TARGET=http://localhost:4100 npm run dev`.

Other scripts:

| Script | Purpose |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |

`npm run preview` does **not** run the dev proxy. For a production deployment, serve `dist/` from the same origin as the API. One way is to copy `dist/` into `backend/public`, which Express already serves.

## Structure

```
src/
├── main.jsx                 router + AuthProvider + App + global styles
├── styles.css               design tokens, light/dark themes, all component styles
├── App.jsx                  route table
├── api/client.js            fetch wrapper and token storage
├── context/AuthContext.jsx  session state: user, token, role, loading
├── hooks/
│   ├── usePaginated.js      cursor pagination for list endpoints
│   └── useAction.js         busy and error state for one-off requests
├── components/
│   ├── ui.jsx               Button, Field, Avatar, Chips, EmptyState, ConfirmButton, CopyId…
│   ├── Icon.jsx             inline SVG icon set
│   ├── format.js            dates, relative time, initials, avatar colours
│   └── …                    Navbar, route guards, forms, list items, admin tabs
└── pages/                   Login, Notes, Posts, Profile, Admin, NotFound
```

## Design

The visual design is plain CSS in `src/styles.css`, built on CSS custom properties:

- **Design tokens**: colours, radii, shadows and spacing are variables on `:root`, so the whole theme can be changed in one place. The brand colour is teal (`--primary`).
- **Light and dark mode**: dark mode follows the operating system setting through `prefers-color-scheme`.
- **Layout**:
  - A sticky, translucent header with icon navigation and the signed-in user.
  - Pages use a centred container with a page header.
  - Notes, Posts and Profile use a two-column layout (a form or detail card plus the list). Below 960px it collapses to one column.
- **Components**:
  - Cards, form fields with labels and hints, and buttons in primary, secondary, ghost and danger styles.
  - Role badges, interest chips, avatars with generated initials and colours, and a copy-to-clipboard ID pill.
- **States**:
  - Loading shows skeleton placeholders on first load and spinners inside buttons.
  - Lists that are empty show an empty state, and a "You're all caught up" footer marks the end of a list.
  - Errors appear inline as alerts.
- **Delete confirmation**: deleting asks for confirmation inline ("Delete this note? Yes, delete / Cancel") instead of a browser `confirm()` popup.
- **Responsive**:
  - On small screens, nav labels collapse to icons and the login page hides its brand panel.
  - Tables scroll horizontally inside their card.
- **Accessibility**:
  - Every input has a `<label>`.
  - Icon-only buttons have `aria-label`s, and focus rings are visible.
  - Tabs use `role="tab"` with `aria-selected`.
  - Animations are turned off for users who prefer reduced motion.

## How it works

### API client (`src/api/client.js`)

- Adds the `/api` prefix to every path, sends JSON, and adds `Authorization: Bearer <token>` when a token is stored.
- Turns any non-2xx response into a thrown `ApiError`, using the server's message. For validation errors, the field messages are appended (for example `Validation failed: name must be 1-100 characters`).
- On **401**, if a token was sent, it clears the token and redirects to `/login`. A failed login sends no token, so it keeps its inline "Invalid email or password" message and does not redirect.

### Session (`src/context/AuthContext.jsx`)

- Exposes `{ user, token, role, loading, login, register, logout, setUser }`.
- On startup, if a token is stored, it calls `GET /users/me` to restore the session. `loading` stays true until that finishes, so the route guards don't redirect too early.
- The token is kept in `localStorage` under `careguide.token`.

### Route guards

- `ProtectedRoute`: shows a loading screen while the session is restored. If no one is logged in, it redirects to `/login` and remembers the page that was requested.
- `AdminRoute`: does the same, and also requires `role === 'admin'`. Other users see an "Admins only" notice.

### Pagination (`src/hooks/usePaginated.js`)

`usePaginated(url, params)` returns `{ items, setItems, nextCursor, loading, error, loadMore, reset }`.

- It requests `?limit=10&after=<nextCursor>` and expects `{ data, nextCursor }` back.
- When `url` or `params` change, it starts again from the first page. A request counter discards out-of-date responses, so fast filter changes and React StrictMode's double effects can't mix pages together.
- The posts-by-user view returns `{ user: { _id, name, posts }, nextCursor }`, so it has its own cursor state in `components/UserPosts.jsx`.

### Forms

Each form uses `useAction`:

- The submit button is disabled while the request is running.
- The server's error appears inline under the form.
- The client does not enforce business rules. Ownership, admin-only actions, and deleting yourself or the last admin are all decided by the server, and the UI shows the server's response. Edit and delete buttons on posts appear only for the author or an admin. This only affects what is shown, and the server checks again.

All user content is rendered as React text nodes. `dangerouslySetInnerHTML` is never used.

The posts API populates `author` as `{ _id, name }`, so the feed shows real author names. Ownership checks compare `author._id` with the current user's id.

## Pages

| Route | Access | What it does |
|---|---|---|
| `/login` | public | Split-screen sign-in page with **Log in** and **Register** tabs. Register has no role field |
| `/notes` | logged in | Create a note. Paginated list with inline edit and delete (with inline confirm). Admins see every note and get an owner-id filter |
| `/posts` | logged in | Create a post. Global feed with author names and Load more. Edit and delete on your own posts (admins: all posts). "View posts by this user" opens a side panel with that user's posts and their own Load more |
| `/profile` | logged in | Profile card plus an edit form for name and interests. Interests are entered comma-separated and converted to a trimmed, lowercase, de-duplicated array, with a live preview |
| `/admin` | admin | Three tabs, linkable with `?tab=`: **Users** (table with avatars and role badges; add, edit, delete), **Grouped by interests** (a card per interest showing its members, with an optional filter; paged by interest name), **All notes** (owner filter) |
