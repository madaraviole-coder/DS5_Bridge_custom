#include "touchpad_zone.h"


namespace {

TouchpadZoneConfig s_config = {
    true, // enabled
    50,   // deadzone_percent (50% of 300px = 150px radius around center 960, 540)
    {
        TouchpadTargetTriangle, // Zone 1 (Top-Left)
        TouchpadTargetCircle,   // Zone 2 (Top-Right)
        TouchpadTargetSquare,   // Zone 3 (Bottom-Left)
        TouchpadTargetCross     // Zone 4 (Bottom-Right)
    },
    TouchpadOperatingModeZones,
    2,
    { 1, 2, 0, 0, 0, 0 },
    TouchpadGestureActionShortcut,
    TouchpadTargetDisabled
};

// Continuous touch tracking state
uint32_t s_report_ticks = 0;
uint32_t s_last_touch_tick = 0;
uint16_t s_last_touch_x = 0;
uint16_t s_last_touch_y = 0;
TouchpadZoneId s_last_touch_zone = TouchpadZoneNone;
bool s_has_recent_touch = false;

// Swipe sequence tracking state
uint8_t s_stroke[6] = {};
uint8_t s_stroke_len = 0;
bool s_gesture_triggered = false;
TouchpadZoneTargetButton s_injected_button = TouchpadTargetDisabled;
uint16_t s_injected_ticks_remaining = 0;

// Click latching state to prevent contact flicker / loss on mechanical edge click
bool s_click_latched = false;
TouchpadZoneId s_latched_zone = TouchpadZoneNone;

constexpr uint32_t kTouchHistoryTimeoutTicks = 1500; // ~1.5 seconds retention

void inject_target_button(uint8_t *report, uint16_t len, TouchpadZoneTargetButton target) {
    switch (target) {
        case TouchpadTargetTriangle:
            report[7] |= 0x80;
            break;
        case TouchpadTargetCircle:
            report[7] |= 0x40;
            break;
        case TouchpadTargetCross:
            report[7] |= 0x20;
            break;
        case TouchpadTargetSquare:
            report[7] |= 0x10;
            break;
        case TouchpadTargetL1:
            report[8] |= 0x01;
            break;
        case TouchpadTargetR1:
            report[8] |= 0x02;
            break;
        case TouchpadTargetL2:
            report[8] |= 0x04;
            report[4] = 0xFF;
            break;
        case TouchpadTargetR2:
            report[8] |= 0x08;
            report[5] = 0xFF;
            break;
        case TouchpadTargetCreate:
            report[8] |= 0x10;
            break;
        case TouchpadTargetOptions:
            report[8] |= 0x20;
            break;
        case TouchpadTargetL3:
            report[8] |= 0x40;
            break;
        case TouchpadTargetR3:
            report[8] |= 0x80;
            break;
        case TouchpadTargetHome:
            if (len > 9) {
                report[9] |= 0x01;
            }
            break;
        case TouchpadTargetDpadUp:
            report[7] = static_cast<uint8_t>((report[7] & ~0x0F) | 0x00);
            break;
        case TouchpadTargetDpadRight:
            report[7] = static_cast<uint8_t>((report[7] & ~0x0F) | 0x02);
            break;
        case TouchpadTargetDpadDown:
            report[7] = static_cast<uint8_t>((report[7] & ~0x0F) | 0x04);
            break;
        case TouchpadTargetDpadLeft:
            report[7] = static_cast<uint8_t>((report[7] & ~0x0F) | 0x06);
            break;
        case TouchpadTargetDisabled:
        case TouchpadTargetTouchpadClick:
        default:
            break;
    }
}

} // namespace

void touchpad_zone_init() {
    s_config.enabled = true;
    s_config.deadzone_percent = 50;
    s_config.zone_targets[0] = TouchpadTargetTriangle;
    s_config.zone_targets[1] = TouchpadTargetCircle;
    s_config.zone_targets[2] = TouchpadTargetSquare;
    s_config.zone_targets[3] = TouchpadTargetCross;
    s_config.mode = TouchpadOperatingModeZones;
    s_config.gesture_sequence_len = 2;
    s_config.gesture_sequence[0] = 1;
    s_config.gesture_sequence[1] = 2;
    s_config.gesture_sequence[2] = 0;
    s_config.gesture_sequence[3] = 0;
    s_config.gesture_sequence[4] = 0;
    s_config.gesture_sequence[5] = 0;
    s_config.gesture_action_type = TouchpadGestureActionShortcut;
    s_config.gesture_target_button = TouchpadTargetDisabled;

    s_stroke_len = 0;
    s_gesture_triggered = false;
    s_injected_button = TouchpadTargetDisabled;
    s_injected_ticks_remaining = 0;

    s_report_ticks = 0;
    s_last_touch_tick = 0;
    s_last_touch_x = 0;
    s_last_touch_y = 0;
    s_last_touch_zone = TouchpadZoneNone;
    s_has_recent_touch = false;
    s_click_latched = false;
    s_latched_zone = TouchpadZoneNone;
}

bool touchpad_zone_is_enabled() {
    return s_config.enabled;
}

void touchpad_zone_set_enabled(bool enabled) {
    s_config.enabled = enabled;
    if (!enabled) {
        s_click_latched = false;
        s_latched_zone = TouchpadZoneNone;
        s_stroke_len = 0;
        s_gesture_triggered = false;
        s_injected_ticks_remaining = 0;
    }
}

bool touchpad_zone_toggle() {
    touchpad_zone_set_enabled(!s_config.enabled);
    return s_config.enabled;
}

TouchpadZoneConfig const &touchpad_zone_get_config() {
    return s_config;
}

void touchpad_zone_set_config(TouchpadZoneConfig const &config) {
    s_config = config;
}

void touchpad_zone_set_target(uint8_t zone_1_to_4, TouchpadZoneTargetButton target) {
    if (zone_1_to_4 >= 1 && zone_1_to_4 <= 4) {
        s_config.zone_targets[zone_1_to_4 - 1] = target;
    }
}

TouchpadZoneId touchpad_zone_detect(uint16_t x, uint16_t y, uint8_t deadzone_percent) {
    constexpr int32_t kCenterX = 960;
    constexpr int32_t kCenterY = 540;
    constexpr int32_t kMaxRadius = 300;

    const int32_t deadzone_radius = (kMaxRadius * static_cast<int32_t>(deadzone_percent)) / 100;
    const int32_t dx = static_cast<int32_t>(x) - kCenterX;
    const int32_t dy = static_cast<int32_t>(y) - kCenterY;

    if ((dx * dx + dy * dy) < (deadzone_radius * deadzone_radius)) {
        return TouchpadZoneNone; // Inside center deadzone
    }

    if (x < kCenterX && y < kCenterY) {
        return TouchpadZone1; // Top-Left
    }
    if (x >= kCenterX && y < kCenterY) {
        return TouchpadZone2; // Top-Right
    }
    if (x < kCenterX && y >= kCenterY) {
        return TouchpadZone3; // Bottom-Left
    }
    return TouchpadZone4; // Bottom-Right
}

uint8_t touchpad_zone_process_report(uint8_t *report, uint16_t len) {
    if (report == nullptr || len < 40 || !s_config.enabled) {
        return 0;
    }

    s_report_ticks++;

    if (s_injected_ticks_remaining > 0) {
        inject_target_button(report, len, s_injected_button);
        s_injected_ticks_remaining--;
    }

    // Step 1: Extract touch information from point 0 and point 1
    bool contact_active = false;
    uint16_t current_x = 0;
    uint16_t current_y = 0;

    uint8_t const *pdata0 = report + 32;
    uint8_t const *pdata1 = report + 36;

    if ((pdata0[0] & 0x80) == 0) {
        contact_active = true;
        current_x = static_cast<uint16_t>(
            static_cast<uint16_t>(pdata0[1])
            | (static_cast<uint16_t>(pdata0[2] & 0x0f) << 8)
        );
        current_y = static_cast<uint16_t>(
            static_cast<uint16_t>((pdata0[2] >> 4) & 0x0f)
            | (static_cast<uint16_t>(pdata0[3]) << 4)
        );
    } else if ((pdata1[0] & 0x80) == 0) {
        contact_active = true;
        current_x = static_cast<uint16_t>(
            static_cast<uint16_t>(pdata1[1])
            | (static_cast<uint16_t>(pdata1[2] & 0x0f) << 8)
        );
        current_y = static_cast<uint16_t>(
            static_cast<uint16_t>((pdata1[2] >> 4) & 0x0f)
            | (static_cast<uint16_t>(pdata1[3]) << 4)
        );
    }

    // Step 2: Continuously update touch history whenever contact is detected
    if (contact_active) {
        s_last_touch_x = current_x;
        s_last_touch_y = current_y;
        s_last_touch_tick = s_report_ticks;
        s_last_touch_zone = touchpad_zone_detect(current_x, current_y, s_config.deadzone_percent);
        s_has_recent_touch = true;
    }

    // Step 2b: Process swipe gesture detection if in swipe mode
    if (s_config.mode == TouchpadOperatingModeSwipe && s_config.gesture_sequence_len >= 2) {
        uint8_t triggered_shortcut = 0;
        if (contact_active) {
            TouchpadZoneId zone = touchpad_zone_detect(current_x, current_y, s_config.deadzone_percent);
            if (zone != TouchpadZoneNone) {
                if (s_stroke_len == 0) {
                    s_stroke[0] = static_cast<uint8_t>(zone);
                    s_stroke_len = 1;
                } else if (s_stroke[s_stroke_len - 1] != static_cast<uint8_t>(zone) && s_stroke_len < 6) {
                    s_stroke[s_stroke_len++] = static_cast<uint8_t>(zone);
                    if (!s_gesture_triggered && s_stroke_len == s_config.gesture_sequence_len) {
                        bool match = true;
                        for (uint8_t i = 0; i < s_stroke_len; i++) {
                            if (s_stroke[i] != s_config.gesture_sequence[i]) {
                                match = false;
                                break;
                            }
                        }
                        if (match) {
                            s_gesture_triggered = true;
                            if (s_config.gesture_action_type == TouchpadGestureActionButton) {
                                s_injected_button = s_config.gesture_target_button;
                                s_injected_ticks_remaining = 60;
                                inject_target_button(report, len, s_injected_button);
                            } else {
                                triggered_shortcut = 0x50;
                            }
                        }
                    }
                }
            }
        } else {
            s_stroke_len = 0;
            s_gesture_triggered = false;
        }
        return triggered_shortcut;
    }

    // Step 3: Check physical click
    const bool physical_click = (report[9] & 0x02) != 0;
    if (!physical_click) {
        // Physical click released -> clear latch
        s_click_latched = false;
        s_latched_zone = TouchpadZoneNone;
        return 0;
    }

    // If click was not yet latched on previous frame, resolve the zone now
    if (!s_click_latched) {
        TouchpadZoneId resolved_zone = TouchpadZoneNone;

        if (contact_active) {
            resolved_zone = touchpad_zone_detect(current_x, current_y, s_config.deadzone_percent);
        } else if (s_has_recent_touch && (s_report_ticks - s_last_touch_tick <= kTouchHistoryTimeoutTicks)) {
            // Edge/corner fallback: capacitive contact dropped at instant of click, use recent touch zone!
            resolved_zone = s_last_touch_zone;
        }

        s_latched_zone = resolved_zone;
        s_click_latched = true;
    }

    // If latched zone is inside center deadzone (or no zone detected):
    // Pass through as standard Touchpad Click
    if (s_latched_zone == TouchpadZoneNone) {
        return 0;
    }

    // Remap the zone to target button
    const TouchpadZoneTargetButton target = s_config.zone_targets[s_latched_zone - 1];
    if (target == TouchpadTargetTouchpadClick) {
        // Explicitly configured as normal Touchpad Click passthrough
        return 0;
    }

    // Suppress physical touchpad click from host report
    report[9] &= static_cast<uint8_t>(~0x02);

    // Suppress raw touch packets so host game/OS does not register touchpad touch/gesture on remapped click
    report[32] = 0x80;
    report[36] = 0x80;

    // Inject remapped button
    inject_target_button(report, len, target);
    return 0;
}
