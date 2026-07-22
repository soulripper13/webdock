"""Switch platform for Webdock VPS integration."""
import logging
from typing import Any

from homeassistant.components.switch import SwitchEntity
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
    """Set up Webdock VPS power switches."""
    coordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
    
    known_slugs: set[str] = set()

    def add_new_servers() -> None:
        new_slugs = set(coordinator.data) - known_slugs
        if new_slugs:
            async_add_entities(
                WebdockPowerSwitch(coordinator, slug, entry.entry_id)
                for slug in new_slugs
            )
            known_slugs.update(new_slugs)

    add_new_servers()
    entry.async_on_unload(coordinator.async_add_listener(add_new_servers))


class WebdockPowerSwitch(WebdockEntity, SwitchEntity):
    """Representation of a Webdock VPS power switch."""

    def __init__(self, coordinator, server_slug: str, entry_id: str) -> None:
        """Initialize the switch."""
        super().__init__(coordinator, server_slug)
        self.entry_id = entry_id
        self._attr_unique_id = f"{server_slug}_power_switch"
        self._attr_name = "Power"
        self._attr_icon = "mdi:power"
        self._is_optimistic_on = None

    @property
    def is_on(self) -> bool:
        """Return true if VPS is running."""
        if self._is_optimistic_on is not None:
            return self._is_optimistic_on
        
        status = str(self.server_data.get("status", "")).strip().lower()
        # Webdock running status is usually "running" or "active" or "provisioning"
        return status in ("running", "active", "provisioning")

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn the VPS on."""
        self._is_optimistic_on = True
        self.async_write_ha_state()
        
        api = self.hass.data[DOMAIN][self.entry_id]["api"]
        try:
            await api.start(self.server_slug)
        except Exception as err:
            raise HomeAssistantError(
                f"Failed to start Webdock VPS {self.server_slug}: {err}"
            ) from err
        finally:
            self._is_optimistic_on = None
            await self.coordinator.async_request_refresh()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn the VPS off."""
        self._is_optimistic_on = False
        self.async_write_ha_state()
        
        api = self.hass.data[DOMAIN][self.entry_id]["api"]
        try:
            await api.stop(self.server_slug)
        except Exception as err:
            raise HomeAssistantError(
                f"Failed to stop Webdock VPS {self.server_slug}: {err}"
            ) from err
        finally:
            self._is_optimistic_on = None
            await self.coordinator.async_request_refresh()
