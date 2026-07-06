import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const caller = await getSessionUser(request);
    
    const serverDate = new Date();
    
    // Convert to Asia/Makassar time
    const makassarTimeStr = serverDate.toLocaleString('en-US', { 
      timeZone: 'Asia/Makassar', 
      hour12: false 
    });
    
    const timePart = makassarTimeStr.split(', ')[1] || '';
    const [hourStr, minuteStr, secondStr] = timePart.split(':');
    const currentHour = parseInt(hourStr || '0', 10);
    const currentMinute = parseInt(minuteStr || '0', 10);
    const currentSecond = parseInt(secondStr || '0', 10);
    const currentMinutes = currentHour * 60 + currentMinute;

    let userSettings = null;
    let autoAttendanceEvaluation = {};

    if (caller) {
      const dbRes = await query(
        `SELECT cutoff_clockin, cutoff_checkout, auto_attendance, preferred_location_id 
         FROM users WHERE id = $1`,
        [caller.id]
      );
      if (dbRes.rowCount > 0) {
        userSettings = dbRes.rows[0];
        
        const cutoffIn = userSettings.cutoff_clockin || '07:30';
        const cutoffOut = userSettings.cutoff_checkout || '17:00';
        const [ciH, ciM] = cutoffIn.split(':').map(Number);
        const [coH, coM] = cutoffOut.split(':').map(Number);
        const ciMinutes = ciH * 60 + ciM;
        const coMinutes = coH * 60 + coM;

        autoAttendanceEvaluation = {
          auto_attendance_enabled: userSettings.auto_attendance,
          cutoff_clockin_time: cutoffIn,
          cutoff_clockin_minutes: ciMinutes,
          cutoff_checkout_time: cutoffOut,
          cutoff_checkout_minutes: coMinutes,
          current_time_minutes: currentMinutes,
          is_past_clockin_cutoff: currentMinutes >= ciMinutes,
          is_past_checkout_cutoff: currentMinutes >= coMinutes,
        };
      }
    }

    return NextResponse.json({
      success: true,
      debug_info: {
        server_raw_time: serverDate.toISOString(),
        server_local_time: serverDate.toString(),
        server_timezone_offset_minutes: serverDate.getTimezoneOffset(),
        user_timezone: 'Asia/Makassar (GMT+8)',
        user_local_time_formatted: makassarTimeStr,
        parsed_makassar_time: {
          hour: currentHour,
          minute: currentMinute,
          second: currentSecond,
          total_minutes_of_day: currentMinutes
        },
        user_authenticated: !!caller,
        user_settings: userSettings,
        auto_attendance_evaluation: autoAttendanceEvaluation
      }
    });
  } catch (error: any) {
    console.error('Debug Time API error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
