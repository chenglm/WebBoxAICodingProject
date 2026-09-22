CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT, email VARCHAR(200) NOT NULL UNIQUE, password_hash VARCHAR(100) NOT NULL,
  role VARCHAR(16) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_preferences (
  user_id BIGINT PRIMARY KEY, preferred_categories VARCHAR(500) NOT NULL DEFAULT '', spice_preference VARCHAR(30), taste_preference VARCHAR(100), budget_cents BIGINT,
  CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE user_allergens (user_id BIGINT NOT NULL, allergen VARCHAR(80) NOT NULL, PRIMARY KEY(user_id, allergen), CONSTRAINT fk_allergen_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE addresses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT NOT NULL, label VARCHAR(60) NOT NULL, address VARCHAR(200) NOT NULL, is_default BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_address_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE dishes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(120) NOT NULL, description VARCHAR(1000) NOT NULL, category VARCHAR(60) NOT NULL, protein VARCHAR(60), spice_level VARCHAR(30),
  price_cents BIGINT NOT NULL, image_url VARCHAR(500), visible BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE dish_allergens (dish_id BIGINT NOT NULL, allergen VARCHAR(80) NOT NULL, PRIMARY KEY(dish_id, allergen), CONSTRAINT fk_dish_allergen FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE);
CREATE TABLE option_groups (id BIGINT PRIMARY KEY AUTO_INCREMENT, dish_id BIGINT NOT NULL, name VARCHAR(100) NOT NULL, required_group BOOLEAN NOT NULL DEFAULT FALSE, min_selections INT NOT NULL DEFAULT 0, max_selections INT NOT NULL DEFAULT 1, CONSTRAINT fk_option_group_dish FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE);
CREATE TABLE option_items (id BIGINT PRIMARY KEY AUTO_INCREMENT, option_group_id BIGINT NOT NULL, name VARCHAR(100) NOT NULL, extra_price_cents BIGINT NOT NULL DEFAULT 0, CONSTRAINT fk_option_item_group FOREIGN KEY(option_group_id) REFERENCES option_groups(id) ON DELETE CASCADE);
CREATE TABLE daily_menus (menu_date DATE NOT NULL, dish_id BIGINT NOT NULL, available_quantity INT NOT NULL, PRIMARY KEY(menu_date,dish_id), CONSTRAINT ck_daily_quantity CHECK(available_quantity >= 0), CONSTRAINT fk_daily_dish FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE);
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT NOT NULL, delivery_date DATE NOT NULL, meal_period VARCHAR(16) NOT NULL, status VARCHAR(16) NOT NULL, active_meal_key VARCHAR(40),
  address_snapshot VARCHAR(200) NOT NULL, total_cents BIGINT NOT NULL, idempotency_key VARCHAR(255) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_order_idempotency(user_id,idempotency_key), UNIQUE KEY uq_active_order(user_id,active_meal_key),
  CONSTRAINT fk_order_user FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE order_items (id BIGINT PRIMARY KEY AUTO_INCREMENT, order_id BIGINT NOT NULL, dish_id BIGINT NOT NULL, dish_name VARCHAR(120) NOT NULL, unit_price_cents BIGINT NOT NULL, quantity INT NOT NULL, subtotal_cents BIGINT NOT NULL, CONSTRAINT fk_order_item_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE);
CREATE TABLE order_item_options (id BIGINT PRIMARY KEY AUTO_INCREMENT, order_item_id BIGINT NOT NULL, option_item_id BIGINT NOT NULL, option_name VARCHAR(100) NOT NULL, extra_price_cents BIGINT NOT NULL, CONSTRAINT fk_item_option_item FOREIGN KEY(order_item_id) REFERENCES order_items(id) ON DELETE CASCADE);
CREATE TABLE idempotency_records (user_id BIGINT NOT NULL, idempotency_key VARCHAR(255) NOT NULL, order_id BIGINT NOT NULL, request_hash VARCHAR(64) NOT NULL, response_status INT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,idempotency_key), CONSTRAINT fk_idem_order FOREIGN KEY(order_id) REFERENCES orders(id));
CREATE INDEX idx_daily_menu_date ON daily_menus(menu_date);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

INSERT INTO users(email,password_hash,role) VALUES
 ('admin@webbox.example','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','ADMIN'),
 ('employee@webbox.example','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','EMPLOYEE');
INSERT INTO user_preferences(user_id,preferred_categories,spice_preference,taste_preference,budget_cents) VALUES (2,'Chinese,Japanese','Mild','Savory',3500);
INSERT INTO addresses(user_id,label,address,is_default) VALUES (2,'Office','88 Innovation Road, Shanghai',true);
INSERT INTO dishes(name,description,category,protein,spice_level,price_cents,image_url,visible) VALUES
 ('Kung Pao Chicken','Wok-fried chicken with peanuts and peppers.','Chinese','Chicken','Medium',2600,'',true),
 ('Teriyaki Salmon Bowl','Grilled salmon with rice and seasonal vegetables.','Japanese','Salmon','Mild',3200,'',true),
 ('Vegetable Tofu Bowl','Silken tofu, greens and sesame rice.','Vegetarian','Tofu','Mild',2200,'',true),
 ('Beef Noodle Soup','Slow-braised beef with wheat noodles.','Chinese','Beef','Medium',2800,'',true),
 ('Chicken Caesar Salad','Roasted chicken, romaine and parmesan.','Western','Chicken','None',2400,'',true),
 ('Mushroom Risotto','Creamy arborio rice with roasted mushrooms.','Vegetarian','Mushroom','None',2500,'',true),
 ('Spicy Szechuan Fish','Steamed fish with chili and herbs.','Chinese','Fish','Hot',3000,'',true),
 ('Bibimbap','Rice bowl with beef, vegetables and egg.','Korean','Beef','Mild',2700,'',true),
 ('Pesto Pasta','Basil pesto pasta with cherry tomatoes.','Western','Vegetarian','None',2300,'',true);
INSERT INTO dish_allergens(dish_id,allergen) VALUES (1,'Peanuts'),(1,'Soy'),(2,'Fish'),(2,'Soy'),(3,'Soy'),(4,'Gluten'),(5,'Dairy'),(5,'Gluten'),(6,'Dairy'),(8,'Egg'),(9,'Gluten'),(9,'Dairy');
INSERT INTO option_groups(dish_id,name,required_group,min_selections,max_selections) VALUES (1,'Rice choice',true,1,1),(2,'Sauce',true,1,1),(3,'Extra toppings',false,0,2);
INSERT INTO option_items(option_group_id,name,extra_price_cents) VALUES (1,'White rice',0),(1,'Brown rice',100),(2,'Teriyaki sauce',0),(2,'Less sauce',0),(3,'Avocado',300),(3,'Extra vegetables',200);
INSERT INTO daily_menus(menu_date,dish_id,available_quantity) SELECT CURDATE(),id,20 FROM dishes;
INSERT INTO daily_menus(menu_date,dish_id,available_quantity) SELECT DATE_ADD(CURDATE(),INTERVAL 1 DAY),id,25 FROM dishes;
