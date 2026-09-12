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
    }
};

} // namespace

void touchpad_zone_init() {
    s_config.enabled = true;
    s_config.deadzone_percent = 50;
    s_config.zone_targets[0] = TouchpadTargetTriangle;
    s_config.zone_targets[1] = TouchpadTargetCircle;
    s_config.zone_targets[2] = TouchpadTargetSquare;
    s_config.zone_targets[3] = TouchpadTargetCross;
}

bool touchpad_zone_is_enabled() {
    return s_config.enabled;
}

void touchpad_zone_set_enabled(bool enabled) {
    s_config.enabled = enabled;
}

bool touchpad_zone_toggle() {
    s_config.enabled = !s_config.enabled;
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

void touchpad_zone_process_report(uint8_t *report, uint16_t len) {
    if (report == nullptr || len < 40 || !s_config.enabled) {
        return;
    }

    const bool physical_click = (report[9] & 0x02) != 0;
    if (!physical_click) {
        return;
    }

    // Extract touch point 0
    uint8_t const *pdata = report + 32;
    bool contact = (pdata[0] & 0x80) == 0;
    uint16_t x = static_cast<uint16_t>(
        static_cast<uint16_t>(pdata[1])
        | (static_cast<uint16_t>(pdata[2] & 0x0f) << 8)
    );
    uint16_t y = static_cast<uint16_t>(
        static_cast<uint16_t>((pdata[2] >> 4) & 0x0f)
        | (static_cast<uint16_t>(pdata[3]) << 4)
    );

    // Fallback to touch point 1 if point 0 is not active
    if (!contact) {
        uint8_t const *pdata1 = report + 36;
        if ((pdata1[0] & 0x80) == 0) {
            contact = true;
            x = static_cast<uint16_t>(
                static_cast<uint16_t>(pdata1[1])
                | (static_cast<uint16_t>(pdata1[2] & 0x0f) << 8)
            );
            y = static_cast<uint16_t>(
                static_cast<uint16_t>((pdata1[2] >> 4) & 0x0f)
                | (static_cast<uint16_t>(pdata1[3]) << 4)
            );
        }
    }

    if (!contact) {
        // Physical click with no detected finger touch -> leave as normal touchpad click
        return;
    }

    const TouchpadZoneId zone = touchpad_zone_detect(x, y, s_config.deadzone_percent);
    if (zone == TouchpadZoneNone) {
        // In center deadzone -> standard touchpad click passthrough
        return;
    }

    const TouchpadZoneTargetButton target = s_config.zone_targets[zone - 1];
    if (target == TouchpadTargetTouchpadClick) {
        // Configured explicitly as normal touchpad click
        return;
    }

    // Suppress raw touchpad click from host report
    report[9] &= static_cast<uint8_t>(~0x02);

    // Inject remapped button
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
        default:
            break;
    }
}
