-- SQL Migration & Schema for Green Park Family Restaurant Management System
-- Supabase Postgres + RLS Policies + Realtime Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RESTAURANTS
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    upi_id VARCHAR(255) DEFAULT 'greenpark@upi',
    tax_percent DECIMAL(5,2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. USERS (Profiles linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('waiter', 'kitchen', 'cashier', 'admin')),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLES
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'empty' CHECK (status IN ('empty', 'occupied', 'bill_requested')),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_veg BOOLEAN DEFAULT true,
    in_stock BOOLEAN DEFAULT true,
    image_url TEXT,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'billed', 'completed', 'cancelled')),
    waiter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    notes TEXT,
    rate_at_order DECIMAL(10,2) NOT NULL,
    kot_batch INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL CHECK (method IN ('cash', 'upi', 'card')),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    cashier_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE
);

-- 9. INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'kg',
    low_stock_threshold DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

----------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
----------------------------------------------------

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users within their restaurant context
CREATE POLICY "Allow read access to authenticated users" ON public.restaurants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow update for admin on restaurant" ON public.restaurants FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read profiles" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin manage profiles" ON public.users FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated to read/write tables" ON public.tables FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated to read/write menu_categories" ON public.menu_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated to read/write menu_items" ON public.menu_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated to read/write orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated to read/write order_items" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow cashier/admin payments" ON public.payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin/kitchen inventory" ON public.inventory_items FOR ALL USING (auth.role() = 'authenticated');

----------------------------------------------------
-- ENABLE REALTIME PUBLICATION FOR LIVE SYNC
----------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

----------------------------------------------------
-- INITIAL SEED DATA FOR GREEN PARK FAMILY RESTAURANT
----------------------------------------------------

-- Insert default restaurant
INSERT INTO public.restaurants (id, name, upi_id, tax_percent)
VALUES ('e8f98a21-9988-4221-a111-111111111111', 'Green Park Family Restaurant', 'greenpark@upi', 5.00)
ON CONFLICT DO NOTHING;

-- Insert default tables (T-01 to T-10)
INSERT INTO public.tables (id, name, status, restaurant_id) VALUES
('t0000000-0000-0000-0000-000000000001', 'Table 1', 'empty', 'e8f98a21-9988-4221-a111-111111111111'),
('t0000000-0000-0000-0000-000000000002', 'Table 2', 'empty', 'e8f98a21-9988-4221-a111-111111111111'),
('t0000000-0000-0000-0000-000000000003', 'Table 3', 'empty', 'e8f98a21-9988-4221-a111-111111111111'),
('t0000000-0000-0000-0000-000000000004', 'Table 4', 'empty', 'e8f98a21-9988-4221-a111-111111111111'),
('t0000000-0000-0000-0000-000000000005', 'Table 5', 'empty', 'e8f98a21-9988-4221-a111-111111111111'),
('t0000000-0000-0000-0000-000000000006', 'Table 6', 'empty', 'e8f98a21-9988-4221-a111-111111111111')
ON CONFLICT DO NOTHING;

-- Insert menu categories
INSERT INTO public.menu_categories (id, name, restaurant_id) VALUES
('c0000000-0000-0000-0000-000000000001', 'Starters', 'e8f98a21-9988-4221-a111-111111111111'),
('c0000000-0000-0000-0000-000000000002', 'Main Course', 'e8f98a21-9988-4221-a111-111111111111'),
('c0000000-0000-0000-0000-000000000003', 'Breads & Rice', 'e8f98a21-9988-4221-a111-111111111111'),
('c0000000-0000-0000-0000-000000000004', 'Beverages', 'e8f98a21-9988-4221-a111-111111111111'),
('c0000000-0000-0000-0000-000000000005', 'Desserts', 'e8f98a21-9988-4221-a111-111111111111')
ON CONFLICT DO NOTHING;

-- Insert sample menu items
INSERT INTO public.menu_items (id, name, category_id, rate, is_veg, in_stock, restaurant_id) VALUES
('m0000000-0000-0000-0000-000000000001', 'Paneer Tikka', 'c0000000-0000-0000-0000-000000000001', 240.00, true, true, 'e8f98a21-9988-4221-a111-111111111111'),
('m0000000-0000-0000-0000-000000000002', 'Chicken 65', 'c0000000-0000-0000-0000-000000000001', 280.00, false, true, 'e8f98a21-9988-4221-a111-111111111111'),
('m0000000-0000-0000-0000-000000000003', 'Butter Chicken', 'c0000000-0000-0000-0000-000000000002', 320.00, false, true, 'e8f98a21-9988-4221-a111-111111111111'),
('m0000000-0000-0000-0000-000000000004', 'Dal Makhani', 'c0000000-0000-0000-0000-000000000002', 210.00, true, true, 'e8f98a21-9988-4221-a111-111111111111'),
('m0000000-0000-0000-0000-000000000005', 'Butter Naan', 'c0000000-0000-0000-0000-000000000003', 50.00, true, true, 'e8f98a21-9988-4221-a111-111111111111'),
('m0000000-0000-0000-0000-000000000006', 'Hyderabadi Chicken Biryani', 'c0000000-0000-0000-0000-000000000003', 290.00, false, true, 'e8f98a21-9988-4221-a111-111111111111'),
('m0000000-0000-0000-0000-000000000007', 'Fresh Lime Soda', 'c0000000-0000-0000-0000-000000000004', 80.00, true, true, 'e8f98a21-9988-4221-a111-111111111111'),
('m0000000-0000-0000-0000-000000000008', 'Gulab Jamun (2 pcs)', 'c0000000-0000-0000-0000-000000000005', 90.00, true, true, 'e8f98a21-9988-4221-a111-111111111111')
ON CONFLICT DO NOTHING;

-- Insert sample inventory items
INSERT INTO public.inventory_items (name, quantity, unit, low_stock_threshold, restaurant_id) VALUES
('Basmati Rice', 25.00, 'kg', 10.00, 'e8f98a21-9988-4221-a111-111111111111'),
('Paneer', 4.50, 'kg', 5.00, 'e8f98a21-9988-4221-a111-111111111111'),
('Chicken', 18.00, 'kg', 8.00, 'e8f98a21-9988-4221-a111-111111111111'),
('Amul Butter', 3.00, 'kg', 4.00, 'e8f98a21-9988-4221-a111-111111111111'),
('Cooking Oil', 40.00, 'Ltr', 15.00, 'e8f98a21-9988-4221-a111-111111111111')
ON CONFLICT DO NOTHING;
