#ifndef DS5_BRIDGE_COMPANION_H
#define DS5_BRIDGE_COMPANION_H

#include <cstdint>
#include "tusb.h"
#include "debug_config.h"

#define KEYBOARD_HID_INSTANCE 1
#define COMPANION_REPORT_STATUS 0x01
#define COMPANION_REPORT_COMMAND 0x02
#define COMPANION_REPORT_ACK 0x03
#define COMPANION_REPORT_INPUT 0x04
#define COMPANION_REPORT_AUDIO_DEBUG 0x05
#define COMPANION_REPORT_AUDIO_STATS 0x06
#define COMPANION_REPORT_AUDIO_STATUS 0x08
#define COMPANION_REPORT_TRIGGER_TRACE 0x09
#define COMPANION_REPORT_FEEDBACK_TRACE 0x0A
#define COMPANION_REPORT_DEVICE_IDENTITY 0x0D
#define COMPANION_REPORT_FIRMWARE_LOG 0x0E
#define COMPANION_PAYLOAD_SIZE 63

enum CompanionTriggerTraceStage : uint8_t {
    CompanionTriggerTraceHost = 1,
    CompanionTriggerTraceBridgeIn = 2,
    CompanionTriggerTraceBridgeOut = 3,
    CompanionTriggerTraceBt = 4,
    CompanionTriggerTraceDrop = 5,
};

enum CompanionFeedbackTraceStage : uint8_t {
    CompanionFeedbackTraceHost = 1,
    CompanionFeedbackTraceBridgeIn = 2,
    CompanionFeedbackTraceBridgeOut = 3,
    CompanionFeedbackTraceBt = 4,
    CompanionFeedbackTraceDrop = 5,
    CompanionFeedbackTraceAudioEnqueue = 8,
    CompanionFeedbackTraceAudioDrop = 9,
    CompanionFeedbackTraceLocalAudio = 10,
};

enum ChordActionType : uint8_t {
    ChordActionNone = 0,
    ChordActionControllerSetting = 1,
    ChordActionKeyboard = 2,
    ChordActionMedia = 3,
};

enum ChordControllerAction : uint8_t {
    ChordCtrlNone = 0,
    ChordCtrlSleepController = 1,
    ChordCtrlToggleMicMute = 2,
    ChordCtrlSpeakerUp = 3,
    ChordCtrlSpeakerDown = 4,
    ChordCtrlMicUp = 5,
    ChordCtrlMicDown = 6,
    ChordCtrlHapticsUp = 7,
    ChordCtrlHapticsDown = 8,
    ChordCtrlRumbleUp = 9,
    ChordCtrlRumbleDown = 10,
    ChordCtrlTriggersUp = 11,
    ChordCtrlTriggersDown = 12,
    ChordCtrlLightingUp = 13,
    ChordCtrlLightingDown = 14,
    ChordCtrlToggleLightingOverride = 15,
    ChordCtrlToggleAudioHaptics = 16,
    ChordCtrlPersonaDualSense = 17,
    ChordCtrlPersonaDualSenseEdge = 18,
    ChordCtrlPersonaDs4 = 19,
    ChordCtrlPersonaXbox = 20,
    ChordCtrlToggleTurbo = 21,
};

enum ChordMediaActionCode : uint8_t {
    ChordMediaNone = 0,
    ChordMediaPlayPause = 1,
    ChordMediaNextTrack = 2,
    ChordMediaPrevTrack = 3,
    ChordMediaMute = 4,
    ChordMediaVolumeUp = 5,
    ChordMediaVolumeDown = 6,
};

void companion_init();
void companion_loop();
void companion_process_controller_report(uint8_t *report, uint16_t len);
void companion_update_controller_report(uint8_t const *report, uint16_t len);
void companion_note_host_output_report(uint8_t const *report, uint16_t len);
#if DS5_TRIGGER_TRACE_ENABLED
void companion_note_trigger_trace_report(
    uint8_t stage,
    uint8_t const *report,
    uint16_t len,
    uint8_t decision = 0
);
#else
static inline void companion_note_trigger_trace_report(
    uint8_t,
    uint8_t const *,
    uint16_t,
    uint8_t = 0
) {
}
#endif
#if DS5_FEEDBACK_TRACE_ENABLED
void companion_note_feedback_trace_report(
    uint8_t stage,
    uint8_t const *report,
    uint16_t len,
    uint8_t decision = 0,
    uint8_t detail0 = 0,
    uint8_t detail1 = 0,
    uint8_t detail2 = 0,
    uint8_t detail3 = 0
);
void companion_note_feedback_trace_samples(
    uint8_t stage,
    uint8_t const *samples,
    uint16_t len,
    uint8_t detail0 = 0,
    uint8_t detail1 = 0,
    uint8_t detail2 = 0,
    uint8_t detail3 = 0
);
#else
static inline void companion_note_feedback_trace_report(
    uint8_t,
    uint8_t const *,
    uint16_t,
    uint8_t = 0,
    uint8_t = 0,
    uint8_t = 0,
    uint8_t = 0,
    uint8_t = 0
) {
}
static inline void companion_note_feedback_trace_samples(
    uint8_t,
    uint8_t const *,
    uint16_t,
    uint8_t = 0,
    uint8_t = 0,
    uint8_t = 0,
    uint8_t = 0
) {
}
#endif
bool companion_apply_trigger_effect_intensity(uint8_t *payload, uint16_t len);
bool companion_lightbar_override_enabled();
uint16_t companion_get_report(uint8_t report_id, hid_report_type_t report_type, uint8_t *buffer, uint16_t reqlen);
void companion_set_report(uint8_t report_id, hid_report_type_t report_type, uint8_t const *buffer, uint16_t bufsize);

#endif // DS5_BRIDGE_COMPANION_H
