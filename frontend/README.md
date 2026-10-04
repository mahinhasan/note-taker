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
├── styles.css               Care Guide brand tokens and all component styles
├── App.jsx                  route table
├── api/client.js            fetch wrapper and token storage
├── context/AuthContext.jsx  session state: user, token, role, loading
├── hooks/
│   ├── usePaginated.js      cursor pagination for list endpoints
│   └── useAction.js         busy and error state for one-off requests
├── components/
│   ├── ui.jsx               Button, Field, Avatar, Chips, EmptyState, ConfirmButton, CopyId…
│   ├── Icon.jsx             inline SVG icon set
│   ├── BrandMark.jsx        Care Guide lighthouse mark
│   ├── format.js            dates, relative time, initials, avatar colours
│   └── …                    Navbar, route guards, forms, list items, admin tabs
└── pages/                   Login, Notes, Posts, Profile, Admin, NotFound
```

## Design

The UI follows the **Care Guide** brand: deep navy backgrounds, an orange-red accent, Poppins and Rajdhani type, and pill-shaped buttons. Everything is plain CSS in `src/styles.css`, built on CSS custom properties.

**Brand tokens**

| Token | Value | Used for |
|---|---|---|
| `--navy-900` | `#040714` | Page background |
| `--navy-800` | `#0a1024` | Cards and surfaces |
| `--orange` | `#ff3d00` | Primary buttons, active nav, eyebrow lines, badges, focus rings |
| `--text` / `--muted` | `#ffffff` / `#a3a9ba` | Headings and body / secondary text |

**Typography**: fonts are loaded from Google Fonts in `index.html`.
- **Poppins** is used for headings and body text.
- **Rajdhani** is used for the wordmark, navigation, buttons, tabs, badges and table headers.

**Signature details**
- **Eyebrow labels**: page titles carry a label with a short orange line before it ("— Your Workspace").
- **Lighthouse mark**: drawn as inline SVG in `components/BrandMark.jsx` and reused as the favicon.
- **Buttons**: pill-shaped orange buttons with a soft glow. The login and register buttons use the "bubble" style, a white circle with an icon at the right end.
- **Decoration**: dotted patterns, an orange ring, and radial orange glows on the login screen.
- **Small accents**:
  - an orange tab on featured cards
  - an orange edge on list items when hovered
  - an orange underline on the active nav link

**Layout and states**
- The header stays at the top while scrolling, and the content sits in a centred container.
- Notes, Posts and Profile use two columns, which collapse to one below 1024px.
- Loading uses skeleton placeholders and in-button spinners. Empty lists show an empty state, and the end of a list shows "You're all caught up".
- Errors appear inline. Delete asks for confirmation in place ("Delete this note? Yes, delete / Cancel").

**Responsive and accessible**
- **Small screens**:
  - nav labels collapse to icons
  - the login page hides its brand panel
  - tables scroll inside their card
- **Accessibility**:
  - every input has a `<label>`
  - icon-only buttons have `aria-label`s
  - tabs use `role="tab"`
  - focus rings are visible
  - animations are turned off for users who prefer reduced motion

The app is dark-only to match the Care Guide brand. To change the theme, edit the variables at the top of `styles.css`.

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
