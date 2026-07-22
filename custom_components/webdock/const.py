"""Constants for the Webdock VPS integration."""
from homeassistant.const import Platform

DOMAIN = "webdock"

CONF_API_TOKEN = "api_token"
CONF_SCAN_INTERVAL = "scan_interval"

DEFAULT_SCAN_INTERVAL = 60

# Platforms
PLATFORMS = [
    Platform.SENSOR,
    Platform.BINARY_SENSOR,
    Platform.SWITCH,
    Platform.BUTTON,
]
