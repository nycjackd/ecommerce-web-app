var express = require('express');
var db = require('../db');


/*******************************
 Here are our database functions:
 *******************************/

// Some quick info about db commands:
// d.run() - runs a command, no output
// d.get() - runs a command, returns a single row (or the first row). Access with row.whatever
// d.all() - runs a command, returns rows, which is an array of objects. 



// We input just a product_id. We want to output id, name, price, description
function fetchProduct(req, res, next) {
    db.get('SELECT * FROM products WHERE id = ?', [
      req.params.product
    ], function(err, row) {
      if (err) { return next(err); }
      
      var product = {
        id: row.id,
        name: row.name,
        price: row.price,
        description: row.description
      }
      res.locals.product = product;
      next();
    });
  }

// Input a product id, count # in stock. 
function inventorySize(req, res, next) {
    db.get('SELECT COUNT(*) AS count_total FROM inventory WHERE product_id = ?', [
        req.body.id
        ], function(err, row) {
            if (err) { return next(err); }
            res.locals.inStock = row.count_total;
            next();
          });
}

function itemInventorySize(req, res, next) {
  db.get('SELECT COUNT(*) AS count_total FROM inventory WHERE product_id = ?', [
      req.params.product
      ], function(err, row) {
          if (err) { return next(err); }
          res.locals.inStock = row.count_total;
          next();
        });
  }

function toCart(req, res, next) {
  db.run('INSERT INTO cartItems (user_id, product_id) VALUES (?, ?)', [
    req.user.id,
    req.body.id,
  ], function(err) {
      if (err) { return next(err); }
      next();
  });
}

function getCart(req, res, next) {
  db.all('SELECT products.id AS id, products.price AS price, products.name AS name, products.description AS description FROM cartItems LEFT OUTER JOIN products ON (cartItems.product_id=products.id) WHERE cartItems.user_id = ? ', [
    req.user.id
  ], function(err, rows) {
    if (err) { return next(err); }
    res.locals.cart = rows;
    next();
  });
}

function cartToObect(req, res, next) {
  var cart = res.locals.cart;
  var betterCart = [];
  var alreadyExists = false;
  for (var i = 0; i < cart.length; i++) {
    for (var j = 0; j < betterCart.length; j++) {
      if (cart[i].id === betterCart[j].id) {
        betterCart[j].count++;
        alreadyExists = true;
        break;
      }
    }
    if (!alreadyExists) {
      betterCart.push(
        {
          id: cart[i].id,
          name: cart[i].name,
          price: cart[i].price,
          description: cart[i].description,
          count: 1
        }
      );
    }
  }
  console.log(betterCart);
  res.locals.betterCart = betterCart;
  next();
}

function validCart(req, res, next) {
  res.locals.cartSuccess = true;
  db.each('SELECT product_id FROM cartItems WHERE user_id = ?', [
    req.user.id
  ],
  function(err, id) {
    if (err) { return next(err); }
    db.get('SELECT COUNT(*) AS numItems FROM cartItems WHERE product_id = ? AND user_id = ? ', [
      id.product_id,
      req.user.id
    ], function(err, numCart) {
      db.get('SELECT COUNT(*) AS count_total FROM inventory WHERE product_id = ?', [
        req.params.product
        ], function(err, row) {
            if (err) { return next(err); }
            if (row.count_total < numCart.numItems ) {
              res.locals.cartSuccess = false;
              next();
            }

          });
    });
    next();
  });
}

function purchaseCart(req, res, next) {

    for (var i = 0; i < res.locals.betterCart.length; i++) {
      //console.log('res.locals.betterCart[i].count: ' + res.locals.betterCart[i].count);
      //console.log('res.locals.betterCart[i].id: ' + res.locals.betterCart[i].id);
      db.all('SELECT * FROM inventory WHERE product_id = ? LIMIT ?', [
        res.locals.betterCart[i].id,
        res.locals.betterCart[i].count
        ], function(err, rows) {
            if (err) { return next(err); }
            //console.log('Made it to 1');
            for(var j = 0; j < rows.length; j++) {
              //console.log('Made it to 2');
              //console.log('rows[j].id: ' + rows[j].id);
              res.locals.currentRowId = rows[j].id;
              // console.log('inventoryRow.id: ' + inventoryRow.id);
            db.run('INSERT INTO orders (item_id, product_id, user_id) VALUES (?, ?, ?)', [
          res.locals.currentRowId,
          rows[j].product_id,
          req.user.id
          ], function(err) {
              if (err) { return next(err); }
              db.run('DELETE FROM inventory WHERE id = ?', [
                res.locals.currentRowId
                ], function(err) {
                    //console.log('Made it to 3');
                    //console.log('rows[j].id: ' + rows[j].id);
                    /*
                    console.log('cartRow.id: ' + cartRow.id)
                    console.log('Deleting id: ' + inventoryRow.id + ' from inventory');
                    */
                    if (err) { return next(err); }
                    //console.log('req.user: ' + req.user) 
          });
            
        });

      db.run('DELETE FROM inventory WHERE id = ?', [
        rows[j].id
          ], function(err) {
              //console.log('Made it to 3');
              //console.log('rows[j].id: ' + rows[j].id);
              /*
              console.log('cartRow.id: ' + cartRow.id)
              console.log('Deleting id: ' + inventoryRow.id + ' from inventory');
              */
              if (err) { return next(err); }
              //console.log('req.user: ' + req.user)

                   
        });
      }
    });

    }
    db.run('DELETE FROM cartItems WHERE user_id = ?', [
      req.user.id
      ], function(err) {
          if (err) { return next(err); }
      });
    next();
}
// Purchase an item of inventory of a given type
function purchaseProduct(req, res, next) {

    db.get('SELECT * FROM inventory WHERE product_id = ?', [
        req.body.id
        ], function(err, row) {
            if (err) { return next(err); }
            console.log('row: ' + row);
            console.log('row.id: ' + row.id);
            db.run('DELETE FROM inventory WHERE id = ?', [
                row.id
                ], function(err) {
                    if (err) { return next(err); }
                    console.log('req.user: ' + req.user)

                    db.run('INSERT INTO orders (item_id, product_id, user_id) VALUES (?, ?, ?)', [
                        row.id,
                        row.product_id,
                        req.user.id
                    ], function(err) {
                        if (err) { return next(err); }
                        next();
            });
        });
    });
  }

  function deleteCart(req, res, next) {
    db.get('SELECT * FROM cartItems WHERE product_id = ? AND user_id = ?', [
      req.body.id,
      req.user.id
      ], function(err, row) {

        if (err) { return next(err); }
        console.log('row.id: ' + row.id);
        db.run('DELETE FROM cartItems WHERE id = ?', [
          row.id
          ], function(err) {
              if (err) { return next(err); }
              next();
        });
    });
  }

// Returns user as a row, since we don't store first or last name in req.user
function fetchUser(req, res, next) {
    db.get('SELECT * FROM users WHERE username = ?', [
        req.user.username
        ], function(err, row) {
            if (err) { return next(err); }
            res.locals.user = row;
            next();
        });
}

function search(req, res, next) {
    db.all('SELECT * FROM products WHERE (name LIKE ?) OR (description LIKE ?)', [ 
      '%' + res.locals.searchTerm + '%',
      '%' + res.locals.searchTerm + '%'
    ], function(err, rows) {
      if (err) { return next(err); }
      res.locals.searchResults = rows;
      next();
    });
}

var router = express.Router();

router.get('/cart', function(req, res, next) {
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
}, getCart, function(req, res, next) {
  res.render('cart', { cart: res.locals.cart });
});

router.post('/purchase_cart', getCart, function(req, res, next) {
  next();
}, cartToObect, function(req, res, next) {
  console.log('res.locals.betterCart: ' + res.locals.betterCart);
  next();
}, purchaseCart, function(req, res, next) {
  res.redirect('/cart');
});


router.post('/to_cart', function(req, res, next) {
  console.log('req.body.id: ' + req.body.id);
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
}, toCart, function(req, res, next) {
  res.redirect('/cart');
});

router.post('/search', function(req, res, next) {
    res.locals.searchTerm = req.body.search;
    next();
  }, search, function(req, res, next) {
    res.render('search', { results: res.locals.searchResults });
  });

// Note that the res.locals will hold within a res-req cycle, including all of the nexts we chain together. But not ouside of that.
router.get('/products/:product', itemInventorySize, function(req, res, next){
    next();
 }, fetchProduct, itemInventorySize, function(req, res, next){
    var itemDetails = {
      id: req.params.product,
      name: res.locals.product.name,
      description: res.locals.product.description,
      price: res.locals.product.price,
      inventory: res.locals.inStock
    }
    console.log('In stock: ' + res.locals.inStock);
    res.render('item', { item: itemDetails})
 });

 router.get('/', function(req, res, next){
    var loggedIn = true;
    if (!req.user) {
        loggedIn = false;
        res.render('home', { loggedIn: loggedIn });
    } else {
    res.render('home', { loggedIn: loggedIn, user: req.user });
    }
 });

 router.get('/account', function(req, res, next){
    if (!req.user) {
        return res.redirect('/login');
      }
      next();

  }, fetchUser, function(req, res, next){
    var user = {
        id: res.locals.user.id,
        username: res.locals.user.username,
        firstname: res.locals.user.first_name,
        lastname: res.locals.user.last_name
    };
    res.render('account', { user: user });
  });

  router.post('/purchase', inventorySize, function(req, res, next) {
    if (!req.user) {
      console.log("Error: user not found. Redirecting...");
      return(res.redirect('/login'));
    }
    console.log('number in stock: ' + res.locals.inStock);
    if (res.locals.inStock < 1) {
      console.log("Error: item out of stock.");
      return(res.send('error: item out of stock'));
    }
    //console.log('req.params.product: ' + req.params.product);
    next()
  }, purchaseProduct, function (req,res,next) {
      console.log("PurchaseProduct complete. Redirecting...");
      //console.log('req.params.product: ' + req.params.product);
      return(res.redirect('/'));
  });

  router.post('/delete_cart', function(req, res, next) {
    console.log('req.body.id: ' + req.body.id);
    next();
  }, deleteCart, function(req, res, next) {
    res.redirect('/cart');
  });


 module.exports = router;
