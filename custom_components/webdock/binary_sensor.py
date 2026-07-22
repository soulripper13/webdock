"""Binary sensor platform for the Webdock integration."""
from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .entity import WebdockEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Webdock lifecycle binary sensors."""
    coordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
    known_slugs: set[str] = set()

    def add_new_servers() -> None:
        new_slugs = set(coordinator.data) - known_slugs
        if new_slugs:
            async_add_entities(
                WebdockPendingDeletionBinarySensor(coordinator, slug)
                for slug in new_slugs
            )
            known_slugs.update(new_slugs)

    add_new_servers()
    entry.async_on_unload(coordinator.async_add_listener(add_new_servers))


class WebdockPendingDeletionBinarySensor(WebdockEntity, BinarySensorEntity):
    """Indicate whether a server is scheduled for deletion."""

    _attr_name = "Pending Deletion"
    _attr_icon = "mdi:calendar-remove"

    def __init__(self, coordinator, server_slug: str) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, server_slug)
        self._attr_unique_id = f"{server_slug}_pending_deletion"

    @property
    def is_on(self) -> bool:
        """Return whether deletion is pending."""
        return bool(self.server_data.get("pendingDeletion"))
