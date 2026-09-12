#include "touchpad_mouse.h"

#include <algorithm>
#include <cstdlib>
#include <cstring>

#include "bt.h"
#include "tusb.h"
#include "persona/host_persona.h"

#ifdef PICO_ON_DEVICE
#include "pico/time.h"
#else
static inline uint32_t time_us_32() { return 0; }
#endif

namespace {

bool s_touchpad_mouse_active = false;

// Tracking state for Finger 0
bool s_prev_p0_active = false;
uint8_t s_prev_p0_id = 0;
uint16_t s_prev_p0_x = 0;
uint16_t s_prev_p0_y = 0;

// Tracking state for Finger 1
bool s_prev_p1_active = false;
uint8_t s_prev_p1_id = 0;
uint16_t s_prev_p1_x = 0;
uint16_t s_prev_p1_y = 0;

// Tap detection: 2-finger (Right Click)
uint32_t s_tap2_start_us = 0;
bool s_tap2_moved = false;
uint32_t s_right_click_until_us = 0;

// Two-finger scroll accumulator
int32_t s_scroll_accum = 0;

// Physical click state
bool s_physical_left = false;
bool s_physical_right = false;

// Pending movement & scroll for next HID report
int16_t s_pending_dx = 0;
int16_t s_pending_dy = 0;
int16_t s_pending_wheel = 0;
uint8_t s_last_buttons = 0;

// Timed haptic rumble stop for toggle feedback
uint32_t s_rumble_stop_us = 0;

int8_t clamp_i8(int16_t value) {
    if (value > 127) return 127;
    if (value < -127) return -127;
    return static_cast<int8_t>(value);
}

} // namespace

void touchpad_mouse_init() {
    s_touchpad_mouse_active = false;
    s_prev_p0_active = false;
    s_prev_p1_active = false;
    s_pending_dx = 0;
    s_pending_dy = 0;
    s_pending_wheel = 0;
    s_last_buttons = 0;
    s_right_click_until_us = 0;
    s_rumble_stop_us = 0;
}

bool touchpad_mouse_is_active() {
    return s_touchpad_mouse_active;
}

void touchpad_mouse_set_active(bool active) {
    if (s_touchpad_mouse_active == active) {
        return;
    }
    s_touchpad_mouse_active = active;

    const uint32_t now = time_us_32();
    if (active) {
        // Cyan flash: Laptop Touchpad mode active
        bt_set_temporary_lightbar_color(0x00, 0xE5, 0xFF, 100, 800);
        bt_set_classic_rumble_output(140, 0);
        s_rumble_stop_us = now + 120000;
    } else {
        // Blue restore: Normal Gamepad mode
        bt_set_temporary_lightbar_color(0x00, 0x00, 0xFF, 100, 500);
        bt_set_classic_rumble_output(200, 0);
        s_rumble_stop_us = now + 180000;
    }

    // Reset tracking state on mode switch
    s_prev_p0_active = false;
    s_prev_p1_active = false;
    s_pending_dx = 0;
    s_pending_dy = 0;
    s_pending_wheel = 0;
    s_physical_left = false;
    s_physical_right = false;
}

bool touchpad_mouse_toggle() {
    touchpad_mouse_set_active(!s_touchpad_mouse_active);
    return s_touchpad_mouse_active;
}

void touchpad_mouse_process_touch(
    BridgeTouchPoint const *points,
    uint8_t count,
    bool physical_click,
    uint32_t now_us
) {
    if (!s_touchpad_mouse_active || points == nullptr || count < 2) {
        return;
    }

    const BridgeTouchPoint &p0 = points[0];
    const BridgeTouchPoint &p1 = points[1];

    // 1. Physical click handling
    if (physical_click) {
        // Right side of touchpad (>1350 out of 1920) or 2 fingers down -> Right Click
        if (p1.active || (p0.active && p0.x > 1350)) {
            s_physical_right = true;
            s_physical_left = false;
        } else {
            s_physical_left = true;
            s_physical_right = false;
        }
    } else {
        s_physical_left = false;
        s_physical_right = false;
    }

    // 2. Gesture handling: Two fingers active (Scroll & Right-tap)
    if (p0.active && p1.active) {
        if (!s_prev_p0_active || !s_prev_p1_active) {
            // Two-finger touch down
            s_tap2_start_us = now_us;
            s_tap2_moved = false;
            s_scroll_accum = 0;
        } else {
            // Both fingers moving
            const int16_t dy0 = static_cast<int16_t>(p0.y) - static_cast<int16_t>(s_prev_p0_y);
            const int16_t dy1 = static_cast<int16_t>(p1.y) - static_cast<int16_t>(s_prev_p1_y);
            const int16_t avg_dy = (dy0 + dy1) / 2;

            if (std::abs(dy0) > 12 || std::abs(dy1) > 12) {
                s_tap2_moved = true;
            }

            s_scroll_accum += avg_dy;
            constexpr int32_t kScrollThreshold = 22;
            if (std::abs(s_scroll_accum) >= kScrollThreshold) {
                const int16_t steps = static_cast<int16_t>(-(s_scroll_accum / kScrollThreshold));
                s_scroll_accum %= kScrollThreshold;
                s_pending_wheel += steps;
            }
        }
    } else if (s_prev_p0_active && s_prev_p1_active && (!p0.active || !p1.active)) {
        // Two-finger release: Check for two-finger tap (Right Click)
        if (!s_tap2_moved && (now_us - s_tap2_start_us) < 250000) {
            s_right_click_until_us = now_us + 40000; // 40ms click
        }
    }

    // 3. Gesture handling: Single finger active (Cursor movement)
    if (p0.active && !p1.active) {
        if (s_prev_p0_active && s_prev_p0_id == p0.contact_id) {
            // Finger moving
            const int16_t raw_dx = static_cast<int16_t>(p0.x) - static_cast<int16_t>(s_prev_p0_x);
            const int16_t raw_dy = static_cast<int16_t>(p0.y) - static_cast<int16_t>(s_prev_p0_y);

            // Deadzone to prevent jitter when resting finger
            if (std::abs(raw_dx) > 1 || std::abs(raw_dy) > 1) {
                // Scaled movement for precision & speed (~0.6x factor + curve)
                int32_t dx = (raw_dx * 6) / 10;
                int32_t dy = (raw_dy * 6) / 10;

                // Subtle acceleration on fast swipes
                if (std::abs(raw_dx) > 20) dx = (dx * 13) / 10;
                if (std::abs(raw_dy) > 20) dy = (dy * 13) / 10;

                s_pending_dx += clamp_i8(static_cast<int16_t>(dx));
                s_pending_dy += clamp_i8(static_cast<int16_t>(dy));
            }
        }
    }

    // Save previous state for next frame
    s_prev_p0_active = p0.active;
    s_prev_p0_id = p0.contact_id;
    s_prev_p0_x = p0.x;
    s_prev_p0_y = p0.y;

    s_prev_p1_active = p1.active;
    s_prev_p1_id = p1.contact_id;
    s_prev_p1_x = p1.x;
    s_prev_p1_y = p1.y;
}

void touchpad_mouse_loop() {
    const uint32_t now = time_us_32();

    // Handle timed rumble shutoff
    if (s_rumble_stop_us != 0 && static_cast<int32_t>(now - s_rumble_stop_us) >= 0) {
        s_rumble_stop_us = 0;
        bt_set_classic_rumble_output(0, 0);
    }

    if (!s_touchpad_mouse_active) {
        return;
    }

    const uint8_t keyboard_hid_instance = host_persona_keyboard_hid_instance();
    if (!tud_hid_n_ready(keyboard_hid_instance)) {
        return;
    }

    // Determine current button states
    uint8_t buttons = 0;
    if (s_physical_left) {
        buttons |= 0x01; // Left Button
    }
    if (s_physical_right || static_cast<int32_t>(s_right_click_until_us - now) > 0) {
        buttons |= 0x02; // Right Button
    }

    // Only send a mouse report if there is movement, scroll, or button state change
    if (s_pending_dx != 0 || s_pending_dy != 0 || s_pending_wheel != 0 || buttons != s_last_buttons) {
        TouchpadMouseReport report{};
        report.buttons = buttons;
        report.x = clamp_i8(s_pending_dx);
        report.y = clamp_i8(s_pending_dy);
        report.wheel = clamp_i8(s_pending_wheel);
        report.pan = 0;

        // Dispatch HID report on Report ID 2
        if (tud_hid_n_report(keyboard_hid_instance, 2, &report, sizeof(report))) {
            s_pending_dx -= report.x;
            s_pending_dy -= report.y;
            s_pending_wheel -= report.wheel;
            s_last_buttons = buttons;
        }
    }
}
