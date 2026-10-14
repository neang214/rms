## auth
// post   http://localhost:8080/api/auth/login {username, password}
// post   http://localhost:8080/api/auth/logout
// get    http://localhost:8080/api/me

## user
// get    http://localhost:8080/api/users
// get    http://localhost:8080/api/users/:id
// post   http://localhost:8080/api/users { username, email, password, role}
// put    http://localhost:8080/api/users/:id { username, email, role, password}
// delete http://localhost:8080/api/users/:id

## order
// get    http://localhost:8080/api/orders
// get    http://localhost:8080/api/orders/:id
// post   http://localhost:8080/api/orders/:table_id { user_id, note }
// patch  http://localhost:8080/api/users/:id/status {status: ["Pending", "Preparing", "Served", "Paid"]}
// delete http://localhost:8080/api/orders/:id

## table
// get    http://localhost:8080/api/tables
// get    http://localhost:8080/api/tables/:id
// post   http://localhost:8080/api/tables {table_number, capacity, is_available }
// put    http://localhost:8080/api/tables/:id {table_number, capacity, is_available}
// patch  http://localhost:8080/api/tables/:id/toggle { is_available }
// delete http://localhost:8080/api/tables/:id

## menu category
// get    http://localhost:8080/api/menu-categories
// get    http://localhost:8080/api/menu-categories/:id
// post   http://localhost:8080/api/menu-categories {category_name, type}
// put    http://localhost:8080/api/menu-categories/:id {category_name, type}
// delete http://localhost:8080/api/menu-categories/:id

## menu item
// get    http://localhost:8080/api/menu-items
// get    http://localhost:8080/api/menu-items/:id
// get    http://localhost:8080/api/menu-items/category/:categoryId get menu item via categoryId
// post   http://localhost:8080/api/menu-items {item_name, category_id, price, available}
// put    http://localhost:8080/api/menu-items/:id { menu_name, price }
// patch  http://localhost:8080/api/menu-items/:id {available}
// delete http://localhost:8080/api/menu-items/:id

## order item
// get    http://localhost:8080/api/order-items/queue/kitchen
// get    http://localhost:8080/api/order-items/queue/barista
// get    http://localhost:8080/api/order-items/:orderId
// patch  http://localhost:8080/api/order-items/:id/status {available}
// delete http://localhost:8080/api/order-items/:id

## payment method
// get    http://localhost:8080/api/payment-methods
// post   http://localhost:8080/api/payment-methods {method_name}
// delete http://localhost:8080/api/payment-methods/:id

## payment
// get    http://localhost:8080/api/payments
// get    http://localhost:8080/api/payments/:id
// get    http://localhost:8080/api/payments/order/:orderId
// post   http://localhost:8080/api/payments { order_id, method_id }
// patch  http://localhost:8080/api/payments/:id/status { status }

## stock
// get    http://localhost:8080/api/stocks
// get    http://localhost:8080/api/stocks/:id
// get    http://localhost:8080/api/stocks/low
// post   http://localhost:8080/api/stocks { item_name, quantity, unit_id, min_level }
// put    http://localhost:8080/api/stocks/:id { item_name, quantity, unit_id, min_level }
// patch  http://localhost:8080/api/stocks/:id/increase { quantity }
// patch  http://localhost:8080/api/stocks/:id/decrease { quantity }
// delete http://localhost:8080/api/stocks/:id

## stock order
// get    http://localhost:8080/api/stock-orders
// get    http://localhost:8080/api/stock-orders/:id
// post   http://localhost:8080/api/stock-orders { invoice, quantity, stock_id, supplier_id }
// patch  http://localhost:8080/api/stock-orders/:id/status { status }

## supplier
// get http://localhost:8080/api/suplliers
// get http://localhost:8080/api/suplliers/:id
// post http://localhost:8080/api/suplliers {supplier_name, phone, email}
// put http://localhost:8080/api/suplliers/:id { supplier_name, phone, email }
// delete http://localhost:8080/api/suplliers/:id

## analytics
// get http://localhost:8080/api/revenue/daily
// get http://localhost:8080/api/revenue/weekly
// get http://localhost:8080/api/revenue/monthly
// get http://localhost:8080/api/menu/top-selling
// get http://localhost:8080/api/menu/pear-hour