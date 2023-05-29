var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');   //This lets us work with file systems
var crypto = require('crypto');

mkdirp.sync('./var/db');

var db = new sqlite3.Database('./var/db/store.db');

db.serialize(function() {

  db.run("CREATE TABLE IF NOT EXISTS users ( \
    id INTEGER PRIMARY KEY, \
    username TEXT UNIQUE, \
    hashed_password BLOB, \
    salt BLOB, \
    first_name TEXT, \
    last_name TEXT \
  )");
  
  db.run("CREATE TABLE IF NOT EXISTS products ( \
    id INTEGER PRIMARY KEY, \
    name TEXT,\
    price INTEGER, \
    description TEXT \
  )");

  db.run("CREATE TABLE IF NOT EXISTS inventory ( \
    id INTEGER PRIMARY KEY, \
    product_id INTEGER \
  )");

  db.run("CREATE TABLE IF NOT EXISTS orders ( \
    id INTEGER PRIMARY KEY, \
    item_id INTEGER, \
    product_id INTEGER, \
    user_id INTEGER \
  )");

  db.run("CREATE TABLE IF NOT EXISTS cartItems ( \
    id INTEGER PRIMARY KEY, \
    user_id INTEGER, \
    product_id \
  )");

  /*
  db.run("INSERT OR IGNORE INTO products (name, price, description) VALUES (?, ?, ?)", [
    'Product 1',
    10,
    'A very interesting product'
  ]);
  
  db.run("INSERT OR IGNORE INTO products (name, price, description) VALUES (?, ?, ?)", [
      'Product 2',
      20,
      'Popular product'
  ]);

  db.run("INSERT OR IGNORE INTO products (name, price, description) VALUES (?, ?, ?)", [
      'Product 3',
      30,
      'An expensive product'
  ]);

  db.run("INSERT OR IGNORE INTO products (name, price, description) VALUES (?, ?, ?)", [
      'Widget',
      5,
      'A high-quality widget'
  ]);

  db.run("INSERT OR IGNORE INTO products (name, price, description) VALUES (?, ?, ?)", [
      'Gadget',
      50,
      'Our best gadget'
  ]);


  for (var i = 0; i < 4; i++) {
    for (var j = 1; j < 6; j++) {
    db.run("INSERT INTO inventory (product_id) VALUES (?)", [
        j
    ]);
  }
}
*/


  // create an initial user (username: jack, password: password)
  var salt = crypto.randomBytes(16);
  db.run('INSERT OR IGNORE INTO users (username, hashed_password, salt) VALUES (?, ?, ?)', [
    'jack',
    crypto.pbkdf2Sync('password', salt, 310000, 32, 'sha256'),
    salt
  ]);

});

module.exports = db;