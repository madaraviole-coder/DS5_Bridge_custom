#include "turbo_controller.h"

#include <algorithm>
#include <cstring>
#include "bt.h"

#ifdef PICO_ON_DEVICE
#include "pico/time.h"
#else
static inline uint32_t time_us_32() { return 0; }
#endif

namespace {

uint8_t s_turbo_mask = 0;
uint8_t s_prev_candidate_pressed = 0;

// State deteksi double-tap tombol PS
bool s_prev_home_raw = false;
uint32_t s_last_home_press_us = 0;
bool s_turbo_armed = false;
uint32_t s_turbo_armed_until_us = 0;

// State machine getaran (rumble) konfirmasi
enum class RumbleFeedbackState : uint8_t {
    Idle,
    SinglePulse,
    DoublePulse1,
    DoublePulsePause,
    DoublePulse2,
};

RumbleFeedbackState s_rumble_state = RumbleFeedbackState::Idle;
uint32_t s_rumble_step_until_us = 0;

void start_rumble_feedback(bool enabled) {
    const uint32_t now = time_us_32();
    if (enabled) {
        // 1 getaran: tanda Turbo ON
        bt_set_classic_rumble_output(160, 0);
        s_rumble_state = RumbleFeedbackState::SinglePulse;
        s_rumble_step_until_us = now + 130000;
    } else {
        // 2 getaran: tanda Turbo OFF
        bt_set_classic_rumble_output(180, 0);
        s_rumble_state = RumbleFeedbackState::DoublePulse1;
        s_rumble_step_until_us = now + 70000;
    }
}

uint8_t get_candidate_mask(uint8_t const *report) {
    uint8_t mask = 0;
    if (report[7] & 0x20) mask |= TurboCross;
    if (report[7] & 0x40) mask |= TurboCircle;
    if (report[7] & 0x10) mask |= TurboSquare;
    if (report[7] & 0x80) mask |= TurboTriangle;
    if (report[8] & 0x01) mask |= TurboL1;
    if (report[8] & 0x02) mask |= TurboR1;
    if ((report[8] & 0x04) || report[4] > 40) mask |= TurboL2;
    if ((report[8] & 0x08) || report[5] > 40) mask |= TurboR2;
    return mask;
}

} // namespace

void turbo_controller_init() {
    s_turbo_mask = 0;
    s_prev_candidate_pressed = 0;
    s_prev_home_raw = false;
    s_last_home_press_us = 0;
    s_turbo_armed = false;
    s_turbo_armed_until_us = 0;
    s_rumble_state = RumbleFeedbackState::Idle;
    s_rumble_step_until_us = 0;
}

uint8_t turbo_controller_get_mask() {
    return s_turbo_mask;
}

void turbo_controller_set_mask(uint8_t mask) {
    s_turbo_mask = mask;
}

void turbo_controller_toggle_button(uint8_t turbo_button_bit) {
    s_turbo_mask ^= turbo_button_bit;
    start_rumble_feedback((s_turbo_mask & turbo_button_bit) != 0);
}

void turbo_controller_process_report(uint8_t *report, uint16_t len, uint32_t now_us, bool home_raw) {
    if (report == nullptr || len <= 9) {
        return;
    }

    // 1. Deteksi Double-Tap tombol PS (<450ms)
    const bool home_rising = home_raw && !s_prev_home_raw;
    s_prev_home_raw = home_raw;

    if (home_rising) {
        if (s_last_home_press_us != 0 && static_cast<int32_t>(now_us - s_last_home_press_us) < 450000) {
            // Berhasil double tap! Masuk ke mode menunggu tombol target (3 detik)
            s_turbo_armed = true;
            s_turbo_armed_until_us = now_us + 3000000;
            s_last_home_press_us = 0;

            // Indikator Oranye/Kuning + getaran pendek
            bt_set_lightbar_color(0xFF, 0x90, 0x00, 100);
            bt_schedule_lightbar_restore(3000);
            start_rumble_feedback(true);
        } else {
            s_last_home_press_us = now_us;
        }
    }

    // Blokir sinyal tombol PS ke Windows saat double tap agar tidak memicu Steam
    if (s_turbo_armed || (s_last_home_press_us != 0 && static_cast<int32_t>(now_us - s_last_home_press_us) < 450000)) {
        report[9] &= ~0x01;
    }

    // Timeout jika tidak ada tombol target yang ditekan
    if (s_turbo_armed && static_cast<int32_t>(now_us - s_turbo_armed_until_us) >= 0) {
        s_turbo_armed = false;
    }

    const uint8_t candidate_pressed = get_candidate_mask(report);

    // 2. Jika dalam mode Siap Turbo (Armed) dan ada tombol target ditekan
    if (s_turbo_armed) {
        const uint8_t newly_pressed = candidate_pressed & ~s_prev_candidate_pressed;
        if (newly_pressed != 0) {
            for (uint8_t bit = 1; bit != 0; bit <<= 1) {
                if (newly_pressed & bit) {
                    s_turbo_mask ^= bit;
                    const bool is_on = (s_turbo_mask & bit) != 0;
                    s_turbo_armed = false; // Selesai setting

                    if (is_on) {
                        // Turbo AKTIF: Hijau + 1x getaran mantap
                        bt_set_lightbar_color(0x00, 0xFF, 0x00, 100);
                        bt_schedule_lightbar_restore(1200);
                        start_rumble_feedback(true);
                    } else {
                        // Turbo NONAKTIF: Merah + 2x getaran
                        bt_set_lightbar_color(0xFF, 0x00, 0x00, 100);
                        bt_schedule_lightbar_restore(1200);
                        start_rumble_feedback(false);
                    }
                    break;
                }
            }
        }

        // Tahan tombol agar tidak teregister di game saat sedang men-setting
        if (candidate_pressed != 0) {
            report[7] &= ~0xF0;
            report[8] &= ~0x0F;
            report[4] = 0;
            report[5] = 0;
        }
    }

    s_prev_candidate_pressed = candidate_pressed;

    // 3. Efek Autofire 15 Hz saat tombol turbo ditahan
    if (s_turbo_mask != 0 && !s_turbo_armed) {
        const bool release_phase = ((now_us / 33333) % 2) == 1;
        if (release_phase) {
            if ((s_turbo_mask & TurboSquare) && (report[7] & 0x10)) report[7] &= ~0x10;
            if ((s_turbo_mask & TurboCross) && (report[7] & 0x20)) report[7] &= ~0x20;
            if ((s_turbo_mask & TurboCircle) && (report[7] & 0x40)) report[7] &= ~0x40;
            if ((s_turbo_mask & TurboTriangle) && (report[7] & 0x80)) report[7] &= ~0x80;
            if ((s_turbo_mask & TurboL1) && (report[8] & 0x01)) report[8] &= ~0x01;
            if ((s_turbo_mask & TurboR1) && (report[8] & 0x02)) report[8] &= ~0x02;
            if ((s_turbo_mask & TurboL2) && ((report[8] & 0x04) || report[4] > 0)) {
                report[8] &= ~0x04;
                report[4] = 0;
            }
            if ((s_turbo_mask & TurboR2) && ((report[8] & 0x08) || report[5] > 0)) {
                report[8] &= ~0x08;
                report[5] = 0;
            }
        }
    }
}

void turbo_controller_loop() {
    if (s_rumble_state == RumbleFeedbackState::Idle) {
        return;
    }

    const uint32_t now = time_us_32();
    if (static_cast<int32_t>(now - s_rumble_step_until_us) < 0) {
        return;
    }

    switch (s_rumble_state) {
        case RumbleFeedbackState::SinglePulse:
            bt_set_classic_rumble_output(0, 0);
            s_rumble_state = RumbleFeedbackState::Idle;
            break;

        case RumbleFeedbackState::DoublePulse1:
            bt_set_classic_rumble_output(0, 0);
            s_rumble_state = RumbleFeedbackState::DoublePulsePause;
            s_rumble_step_until_us = now + 60000;
            break;

        case RumbleFeedbackState::DoublePulsePause:
            bt_set_classic_rumble_output(180, 0);
            s_rumble_state = RumbleFeedbackState::DoublePulse2;
            s_rumble_step_until_us = now + 70000;
            break;

        case RumbleFeedbackState::DoublePulse2:
            bt_set_classic_rumble_output(0, 0);
            s_rumble_state = RumbleFeedbackState::Idle;
            break;

        default:
            s_rumble_state = RumbleFeedbackState::Idle;
            break;
    }
}
