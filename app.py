from flask import Flask, jsonify, request, g
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "products.db")
DEFAULT_CATEGORIES = ["Alimentos", "Limpieza", "Bebidas"]

app = Flask(__name__, static_folder='.', static_url_path='')


def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
        g.db = db
    return db


def init_db():
    os.makedirs(BASE_DIR, exist_ok=True)
    db = sqlite3.connect(DATABASE)
    cursor = db.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            category TEXT
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS categories (
            name TEXT PRIMARY KEY
        )
        """
    )
    cursor.executemany(
        "INSERT OR IGNORE INTO categories (name) VALUES (?)",
        [(category,) for category in DEFAULT_CATEGORIES]
    )
    db.commit()
    db.close()

@app.teardown_appcontext
def close_db(exception=None):
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/api/products', methods=['GET', 'POST'])
def api_products():
    db = get_db()
    if request.method == 'GET':
        rows = db.execute(
            'SELECT id, name, date, category FROM products ORDER BY date(date) ASC, id ASC'
        ).fetchall()
        return jsonify([dict(row) for row in rows])

    payload = request.get_json(silent=True) or {}
    name = (payload.get('name') or '').strip()
    date = (payload.get('date') or '').strip()
    category = (payload.get('category') or '').strip() or None

    if not name or not date:
        return jsonify({'error': 'El nombre y la fecha son obligatorios.'}), 400

    cursor = db.execute(
        'INSERT INTO products (name, date, category) VALUES (?, ?, ?)',
        (name, date, category),
    )
    db.commit()
    product_id = cursor.lastrowid
    created = db.execute(
        'SELECT id, name, date, category FROM products WHERE id = ?', (product_id,)
    ).fetchone()
    return jsonify(dict(created)), 201


@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def api_delete_product(product_id):
    db = get_db()
    result = db.execute('DELETE FROM products WHERE id = ?', (product_id,))
    db.commit()
    if result.rowcount == 0:
        return jsonify({'error': 'Producto no encontrado.'}), 404
    return jsonify({'deleted': True})


@app.route('/api/categories', methods=['GET', 'POST'])
def api_categories():
    db = get_db()
    if request.method == 'GET':
        rows = db.execute('SELECT name FROM categories ORDER BY name COLLATE NOCASE ASC').fetchall()
        return jsonify([row['name'] for row in rows])

    payload = request.get_json(silent=True) or {}
    name = (payload.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'El nombre de la categoría es obligatorio.'}), 400

    try:
        db.execute('INSERT INTO categories (name) VALUES (?)', (name,))
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({'error': 'La categoría ya existe.'}), 400

    return jsonify({'name': name}), 201


@app.route('/api/categories/<string:category_name>', methods=['DELETE'])
def api_delete_category(category_name):
    db = get_db()
    result = db.execute('DELETE FROM categories WHERE name = ?', (category_name,))
    db.commit()
    if result.rowcount == 0:
        return jsonify({'error': 'Categoría no encontrada.'}), 404
    return jsonify({'deleted': True})


if __name__ == '__main__':
    init_db()
    app.run(debug=True)
