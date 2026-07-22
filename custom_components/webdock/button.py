"""Button platform for Webdock VPS integration."""
import logging

from homeassistant.components.button import ButtonEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .entity import WebdockEntity

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Webdock VPS reboot buttons."""
    coordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
    
    known_slugs: set[str] = set()

    def add_new_servers() -> None:
        new_slugs = set(coordinator.data) - known_slugs
        if new_slugs:
            async_add_entities(
                WebdockRebootButton(coordinator, slug, entry.entry_id)
                for slug in new_slugs
            )
            known_slugs.update(new_slugs)

    add_new_servers()
    entry.async_on_unload(coordinator.async_add_listener(add_new_servers))


class WebdockRebootButton(WebdockEntity, ButtonEntity):
    """Button to reboot the Webdock VPS."""

    def __init__(self, coordinator, server_slug: str, entry_id: str) -> None:
        """Initialize the button."""
        super().__init__(coordinator, server_slug)
        self.entry_id = entry_id
        self._attr_unique_id = f"{server_slug}_reboot_button"
        self._attr_name = "Reboot"
        self._attr_icon = "mdi:restart"

    async def async_press(self) -> None:
        """Press the button to reboot."""
        api = self.hass.data[DOMAIN][self.entry_id]["api"]
        try:
            await api.reboot(self.server_slug)
        except Exception as err:
            raise HomeAssistantError(
                f"Failed to reboot Webdock VPS {self.server_slug}: {err}"
            ) from err
        finally:
            await self.coordinator.async_request_refresh()
