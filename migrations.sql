-- Database Migration for Analytics, Payment Management & Settings
-- Run this in Supabase SQL Editor to update database schema

-- ===================================
-- ANALYTICS TABLES
-- ===================================

-- Analytics events tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly analytics summary
CREATE TABLE IF NOT EXISTS monthly_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE UNIQUE NOT NULL,
  revenue DECIMAL(12,2) DEFAULT 0,
  new_clients INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  paid_invoices INTEGER DEFAULT 0,
  total_invoices INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- PAYMENT ENHANCEMENTS
-- ===================================

-- Add payment-related columns to existing invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS payment_fee DECIMAL(10,2) DEFAULT 0;

-- Payment events tracking
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment settings
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- SETTINGS & USER MANAGEMENT
-- ===================================

-- Application settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, setting_key)
);

-- User management (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name VARCHAR(100) UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_monthly_analytics_month ON monthly_analytics(month);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payment_events_invoice ON payment_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_invoices_paid_at ON invoices(paid_at);
CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id ON invoices(transaction_id);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ===================================
-- RLS (Row Level Security) POLICIES
-- ===================================

-- Enable RLS on all new tables
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Analytics events - users can only see their own events
CREATE POLICY "Users can view own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics events" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Monthly analytics - read-only for authenticated users
CREATE POLICY "Authenticated users can view monthly analytics" ON monthly_analytics
  FOR SELECT USING (auth.role() = 'authenticated');

-- Payment events - admin access only
CREATE POLICY "Admins can view all payment events" ON payment_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = TRUE
    )
  );

-- Payment settings - admin access only
CREATE POLICY "Admins can manage payment settings" ON payment_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = TRUE
    )
  );

-- App settings - different policies for public vs private settings
CREATE POLICY "Everyone can view public settings" ON app_settings
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Admins can view all settings" ON app_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = TRUE
    )
  );

CREATE POLICY "Admins can manage settings" ON app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = TRUE
    )
  );

-- User profiles - users can view and edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
      AND up.is_active = TRUE
    )
  );

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Activity logs - admin access only
CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = TRUE
    )
  );

-- Email templates - admin access only
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.is_active = TRUE
    )
  );

-- ===================================
-- TRIGGERS AND FUNCTIONS
-- ===================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_monthly_analytics_updated_at
  BEFORE UPDATE ON monthly_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON payment_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- INITIAL DATA
-- ===================================

-- Insert default app settings
INSERT INTO app_settings (category, setting_key, setting_value, description, is_public) VALUES
('company', 'name', 'Akusara Digital Agency', 'Company name displayed throughout the application', true),
('company', 'email', 'info@akusara.com', 'Company contact email', true),
('company', 'phone', '+62 812-3456-7890', 'Company phone number', true),
('company', 'address', 'Jakarta, Indonesia', 'Company address', true),
('company', 'currency', 'IDR', 'Default currency for invoices and payments', true),
('company', 'timezone', 'Asia/Jakarta', 'Company timezone', true),
('invoice', 'auto_numbering', 'true', 'Automatically generate invoice numbers', false),
('invoice', 'payment_terms', '30', 'Default payment terms in days', false),
('invoice', 'late_fee_enabled', 'false', 'Enable automatic late fees', false),
('invoice', 'late_fee_percentage', '10', 'Late fee percentage', false),
('email', 'smtp_host', '', 'SMTP server hostname', false),
('email', 'smtp_port', '587', 'SMTP server port', false),
('email', 'smtp_user', '', 'SMTP username', false),
('email', 'smtp_password', '', 'SMTP password', false),
('email', 'from_email', 'noreply@akusara.com', 'Default from email address', false),
('email', 'from_name', 'Akusara Digital Agency', 'Default from name', false)
ON CONFLICT (category, setting_key) DO NOTHING;

-- Insert default payment settings
INSERT INTO payment_settings (setting_key, setting_value, description) VALUES
('midtrans_server_key', '', 'Midtrans server key for production'),
('midtrans_client_key', '', 'Midtrans client key for production'),
('midtrans_sandbox_server_key', '', 'Midtrans server key for sandbox'),
('midtrans_sandbox_client_key', '', 'Midtrans client key for sandbox'),
('midtrans_environment', 'sandbox', 'Midtrans environment (sandbox/production)'),
('payment_success_url', '/payment/success', 'URL after successful payment'),
('payment_failure_url', '/payment/failed', 'URL after failed payment'),
('enable_notifications', 'true', 'Enable payment notifications')
ON CONFLICT (setting_key) DO NOTHING;

-- Create default email templates
INSERT INTO email_templates (template_name, subject, html_content, text_content, variables) VALUES
(
  'invoice_created',
  'Invoice {{invoice_number}} from Akusara Digital Agency',
  '<h2>Invoice {{invoice_number}}</h2><p>Dear {{client_name}},</p><p>Your invoice is ready. Total amount: {{amount}} {{currency}}</p><p>Due date: {{due_date}}</p><p><a href="{{payment_url}}">Pay Now</a></p>',
  'Invoice {{invoice_number}}\n\nDear {{client_name}},\n\nYour invoice is ready. Total amount: {{amount}} {{currency}}\nDue date: {{due_date}}\n\nPay here: {{payment_url}}',
  '{"invoice_number": "INV-001", "client_name": "John Doe", "amount": "1000", "currency": "IDR", "due_date": "2024-12-31", "payment_url": "https://example.com/pay"}'
),
(
  'payment_success',
  'Payment Confirmation - Invoice {{invoice_number}}',
  '<h2>Payment Successful</h2><p>Dear {{client_name}},</p><p>Thank you for your payment of {{amount}} {{currency}} for invoice {{invoice_number}}.</p><p>Payment date: {{payment_date}}</p>',
  'Payment Successful\n\nDear {{client_name}},\n\nThank you for your payment of {{amount}} {{currency}} for invoice {{invoice_number}}.\n\nPayment date: {{payment_date}}',
  '{"invoice_number": "INV-001", "client_name": "John Doe", "amount": "1000", "currency": "IDR", "payment_date": "2024-12-31"}'
)
ON CONFLICT (template_name) DO NOTHING;

-- ===================================
-- FUNCTIONS FOR ANALYTICS
-- ===================================

-- Function to calculate monthly revenue
CREATE OR REPLACE FUNCTION calculate_monthly Revenue(target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE))
RETURNS DECIMAL AS $$
DECLARE
  monthly_revenue DECIMAL;
BEGIN
  SELECT COALESCE(SUM(total), 0)
  INTO monthly_revenue
  FROM invoices
  WHERE status = 'paid'
  AND DATE_TRUNC('month', created_at) = target_month;

  RETURN monthly_revenue;
END;
$$ LANGUAGE plpgsql;

-- Function to get client count in month
CREATE OR REPLACE FUNCTION get_monthly_client_count(target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE))
RETURNS INTEGER AS $$
DECLARE
  client_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT client_id)
  INTO client_count
  FROM invoices
  WHERE DATE_TRUNC('month', created_at) = target_month;

  RETURN COALESCE(client_count, 0);
END;
$$ LANGUAGE plpgsql;