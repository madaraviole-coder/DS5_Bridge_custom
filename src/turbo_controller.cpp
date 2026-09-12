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

// State machine for timed rumble feedback
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
        // Single pulse: 120ms
        bt_set_classic_rumble_output(160, 0);
        s_rumble_state = RumbleFeedbackState::SinglePulse;
        s_rumble_step_until_us = now + 120000;
    } else {
        // Double pulse: 70ms ON, 60ms OFF, 70ms ON
        bt_set_classic_rumble_output(180, 0);
        s_rumble_state = RumbleFeedbackState::DoublePulse1;
        s_rumble_step_until_us = now + 70000;
    }
}

} // namespace

void turbo_controller_init() {
    s_turbo_mask = 0;
    s_prev_candidate_pressed = 0;
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

void turbo_controller_process_report(uint8_t *report, uint16_t len, uint32_t now_us) {
    if (report == nullptr || len <= 9) {
        return;
    }

    // Identify which candidate buttons are physically pressed in this report
    uint8_t candidate_pressed = 0;
    if (report[7] & 0x20) candidate_pressed |= TurboCross;
    if (report[7] & 0x40) candidate_pressed |= TurboCircle;
    if (report[7] & 0x10) candidate_pressed |= TurboSquare;
    if (report[7] & 0x80) candidate_pressed |= TurboTriangle;
    if (report[8] & 0x01) candidate_pressed |= TurboL1;
    if (report[8] & 0x02) candidate_pressed |= TurboR1;
    if ((report[8] & 0x04) || report[4] > 40) candidate_pressed |= TurboL2;
    if ((report[8] & 0x08) || report[5] > 40) candidate_pressed |= TurboR2;

    const bool mute_held = (report[9] & 0x04) != 0;

    // Toggle check: Holding Mute + Pressing candidate button
    if (mute_held) {
        const uint8_t newly_pressed = candidate_pressed & ~s_prev_candidate_pressed;
        if (newly_pressed != 0) {
            for (uint8_t bit = 1; bit != 0; bit <<= 1) {
                if (newly_pressed & bit) {
                    turbo_controller_toggle_button(bit);
                    break;
                }
            }
        }

        // Suppress mute button and candidate buttons during shortcut configuration
        if (candidate_pressed != 0) {
            report[9] &= ~0x04;
            report[7] &= ~0xF0;
            report[8] &= ~0x0F;
            if (candidate_pressed & TurboL2) report[4] = 0;
            if (candidate_pressed & TurboR2) report[5] = 0;
        }
    }

    s_prev_candidate_pressed = candidate_pressed;

    // If any turbo button is active and physically held, oscillate at 15 Hz (~33ms period)
    if (s_turbo_mask != 0) {
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
