# Frond — sample ecommerce store

A learning project: a small plant shop with a product grid, cart, and mock checkout.
No build tools, no framework, no backend — just `index.html`, `styles.css`, and `app.js`.

## Open it in VS Code

1. Unzip this folder and open it in VS Code (`File → Open Folder`).
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions panel, if you don't have it.
3. Right-click `index.html` in the file explorer → **Open with Live Server**.
4. Your browser opens the site at something like `http://127.0.0.1:5500`, and it auto-reloads whenever you save a file.

No Live Server? You can also just double-click `index.html` to open it directly in a browser — everything works the same, you just won't get auto-reload.

## Files

- `index.html` — page structure and product/cart markup
- `styles.css` — all styling, including light/dark mode via `prefers-color-scheme`
- `app.js` — product data, cart logic, and rendering (`renderGrid`, `renderCart`, `addToCart`, etc.)

## Where to start reading

Open `app.js` first. The `PRODUCTS` array at the top is the "database." Everything else —
the grid, the cart drawer, the checkout modal — is just re-rendered from that array plus
the `cart` object, which is saved to `localStorage` on every change.

## Ideas to extend it

- Add a search input that filters `PRODUCTS` by name.
- Swap `localStorage` for a real backend (e.g. Node + Express + SQLite) to practice full-stack basics.
- Add a product detail page (click a card → a bigger view with more info).
- Add real form validation to the checkout modal.
