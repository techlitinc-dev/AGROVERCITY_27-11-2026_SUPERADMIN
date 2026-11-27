def test_spa_serves_index_for_client_routes(client):
    """Client-side routes (React Router) get the app shell."""
    r = client.get("/login")
    assert r.status_code == 200
    assert "text/html" in r.headers["content-type"]


def test_spa_index_not_cached(client):
    """The shell must be revalidated so stale caches can't reference dead bundles."""
    r = client.get("/")
    assert r.status_code == 200
    assert r.headers.get("cache-control") == "no-store, must-revalidate"


def test_spa_missing_asset_is_404_not_index_html(client):
    """Stale hashed bundles must 404 — serving index.html here blanks the page."""
    r = client.get("/assets/index-olddeadhash.js")
    assert r.status_code == 404


def test_spa_existing_file_served(client):
    r = client.get("/app_logo.png")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/png")
