"""Base entity class for Webdock VPS integration."""
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN

class WebdockEntity(CoordinatorEntity):
    """Base class for all Webdock entities."""

    def __init__(self, coordinator, server_slug: str) -> None:
        """Initialize the entity."""
        super().__init__(coordinator)
        self.server_slug = server_slug

    @property
    def server_data(self) -> dict:
        """Return the data for this specific server."""
        return (self.coordinator.data or {}).get(self.server_slug, {})

    @property
    def available(self) -> bool:
        """Return whether this server still exists and coordinator data is current."""
        return super().available and self.server_slug in (self.coordinator.data or {})

    @property
    def extra_state_attributes(self) -> dict:
        """Expose a stable server identifier for dashboard cards and automations."""
        return {"webdock_server_slug": self.server_slug}

    @property
    def device_info(self) -> DeviceInfo:
        """Return device information about this Webdock VPS."""
        data = self.server_data
        name = data.get("name", self.server_slug)
        
        # Safe extraction for nested API response
        profile_data = data.get("profileData") or {}
        cpu = profile_data.get("cpu") or data.get("cpu") or {}
        cores = cpu.get("cores", 0) if isinstance(cpu, dict) else 0
        memory = data.get("memory") or {}
        ram_mb = profile_data.get("ram")
        if ram_mb is None and isinstance(memory, dict):
            ram_mb = memory.get("sizeMb")
        ram_mb = ram_mb or 0
        ram_gb = round(ram_mb / 1024, 1)
        
        profile = f"{cores} vCPU / {ram_gb} GB RAM" if cores > 0 else data.get("profile") or data.get("profileSlug", "Unknown")
        image_data = data.get("imageData") or {}
        image = image_data.get("name") or data.get("image") or data.get("imageSlug", "Unknown")
        location_data = data.get("locationData") or {}
        location = location_data.get("name") or data.get("location") or data.get("locationId", "Unknown")

        return DeviceInfo(
            identifiers={(DOMAIN, self.server_slug)},
            name=f"VPS: {name}",
            manufacturer="Webdock",
            model=f"Profile: {profile}",
            sw_version=image,
            hw_version=location,
            configuration_url="https://webdock.io/en/login",
        )
