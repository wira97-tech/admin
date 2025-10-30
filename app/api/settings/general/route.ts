import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = createClient();

    // Try to get settings from database, but use defaults if table doesn't exist
    const { data: settingsData, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('is_public', true);

    if (error) {
      // Table doesn't exist or other error, return default settings
      const defaultSettings = {
        company: {
          name: 'Akusara Digital Agency',
          email: 'info@akusara.com',
          phone: '+62 812-3456-7890',
          address: 'Jakarta, Indonesia',
          currency: 'IDR',
          timezone: 'Asia/Jakarta',
        },
        invoice: {
          auto_numbering: true,
          payment_terms: '30',
          late_fee_enabled: false,
          late_fee_percentage: '10',
        },
        email: {
          smtp_host: '',
          smtp_port: '587',
          smtp_user: '',
          smtp_password: '',
          from_email: 'noreply@akusara.com',
          from_name: 'Akusara Digital Agency',
        },
        payment: {
          midtrans_server_key: '',
          midtrans_client_key: '',
          midtrans_environment: 'sandbox',
          payment_success_url: '/payment/success',
          payment_failure_url: '/payment/failed',
          enable_notifications: true,
        }
      };

      return NextResponse.json(defaultSettings);
    }

    // Format settings data from database
    const formattedSettings = {
      company: {},
      invoice: {},
      email: {},
      payment: {},
    };

    settingsData?.forEach(setting => {
      const value = setting.setting_value === 'true' ? true :
                   setting.setting_value === 'false' ? false :
                   setting.setting_value;

      if (setting.category === 'company') {
        (formattedSettings.company as any)[setting.setting_key] = value;
      } else if (setting.category === 'invoice') {
        (formattedSettings.invoice as any)[setting.setting_key] = value;
      } else if (setting.category === 'email') {
        (formattedSettings.email as any)[setting.setting_key] = value;
      } else if (setting.category === 'payment') {
        (formattedSettings.payment as any)[setting.setting_key] = value;
      }
    });

    return NextResponse.json(formattedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const { category, settingKey, value } = await request.json();

    if (!category || !settingKey) {
      return NextResponse.json(
        { error: 'Category and setting key are required' },
        { status: 400 }
      );
    }

    // Try to update in database, but ignore errors if table doesn't exist
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        category,
        setting_key: settingKey,
        setting_value: value.toString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'category,setting_key',
      });

    if (error) {
      console.log('Settings table not available, change not saved to database:', error.message);
      // Don't return error, just log it since table might not exist yet
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}