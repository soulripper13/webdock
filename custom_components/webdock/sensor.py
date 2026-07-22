"""Sensor platform for Webdock VPS integration."""
from collections.abc import Callable
from dataclasses import dataclass
import logging
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    PERCENTAGE,
    UnitOfInformation,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .entity import WebdockEntity

_LOGGER = logging.getLogger(__name__)

@dataclass(frozen=True, kw_only=True)
class WebdockSensorEntityDescription(SensorEntityDescription):
    """Class describing Webdock VPS sensor entities."""
    value_fn: Callable[[dict], Any]


def get_ram_gb(data: dict) -> Any:
    """Safely extract RAM and convert MB to GB if needed."""
    ram_val = None
    if isinstance(data.get("profileData"), dict):
        ram_val = data["profileData"].get("ram")
    if ram_val is None and isinstance(data.get("memory"), dict):
        ram_val = data["memory"].get("sizeMb")
    if ram_val is None and isinstance(data.get("ram"), dict):
        ram_val = data["ram"].get("sizeMb")
    if ram_val is None:
        ram_val = data.get("ram") or data.get("memory")
    
    if ram_val is None:
        return None
    
    try:
        val = float(ram_val)
        # If it's a small number like 1, 2, 4, 8, 16, 32, it's already in GB
        if val < 256:
            return round(val, 1)
        # Otherwise it's in MB
        return round(val / 1024, 1)
    except (ValueError, TypeError):
        return None


def get_disk_gb(data: dict) -> Any:
    """Safely extract Disk and convert MB to GB if needed."""
    disk_val = None
    if isinstance(data.get("profileData"), dict):
        disk_val = data["profileData"].get("disk")
    if disk_val is None and isinstance(data.get("disk"), dict):
        disk_val = data["disk"].get("sizeMb")
    if disk_val is None:
        disk_val = data.get("disk")
    
    if disk_val is None:
        return None
    
    try:
        val = float(disk_val)
        # If it's a small number, it's already in GB (e.g. 10, 20, 50, 100)
        if val < 512:
            return round(val, 1)
        # Otherwise it's in MB
        return round(val / 1024, 1)
    except (ValueError, TypeError):
        return None


def get_cpu_cores(data: dict) -> Any:
    """Safely extract CPU Cores."""
    if isinstance(data.get("profileData"), dict):
        cpu = data["profileData"].get("cpu")
        if isinstance(cpu, dict):
            return cpu.get("cores") or cpu.get("threads")
    if isinstance(data.get("cpu"), dict):
        return data["cpu"].get("cores")
    return data.get("cpu") or data.get("cores")


def get_os_image(data: dict) -> Any:
    """Safely extract OS Image."""
    if isinstance(data.get("imageData"), dict):
        return data["imageData"].get("name") or data["imageData"].get("slug")
    if isinstance(data.get("image"), dict):
        return data["image"].get("name") or data["image"].get("slug")
    return data.get("imageSlug") or data.get("image")


def get_location(data: dict) -> Any:
    """Safely extract Location."""
    if isinstance(data.get("location"), dict):
        return data["location"].get("name") or data["location"].get("id")
    return data.get("locationId") or data.get("location")


def get_metric_amount(data: dict, section: str, sampling: str) -> Any:
    """Return an amount from an instant metrics sampling."""
    metrics = data.get("_metrics") or {}
    section_data = metrics.get(section) or {}
    sample = section_data.get(sampling) or {}
    if isinstance(sample, list):
        sample = sample[-1] if sample else {}
    return sample.get("amount") if isinstance(sample, dict) else None


def mib_to_gib(value: Any) -> Any:
    """Convert a metric value from MiB to GiB."""
    try:
        return round(float(value) / 1024, 2) if value is not None else None
    except (TypeError, ValueError):
        return None


def get_cpu_percent(data: dict) -> Any:
    """Convert aggregate CPU seconds in the last 30 minutes to utilization."""
    amount = get_metric_amount(data, "cpu", "latestUsageSampling")
    cores = get_cpu_cores(data)
    try:
        return round(min(100, (float(amount) / (1800 * max(float(cores), 1))) * 100), 1)
    except (TypeError, ValueError):
        return None


SENSOR_DESCRIPTIONS: list[WebdockSensorEntityDescription] = [
    WebdockSensorEntityDescription(
        key="status",
        name="Status",
        icon="mdi:server",
        value_fn=lambda data: str(data.get("status", "Unknown")).strip().capitalize(),
    ),
    WebdockSensorEntityDescription(
        key="ipv4",
        name="IPv4 Address",
        icon="mdi:ip",
        value_fn=lambda data: data.get("publicIpv4") or data.get("ipv4"),
    ),
    WebdockSensorEntityDescription(
        key="ipv6",
        name="IPv6 Address",
        icon="mdi:ip-v6",
        value_fn=lambda data: data.get("publicIpv6") or data.get("ipv6"),
    ),
    WebdockSensorEntityDescription(
        key="location",
        name="Location",
        icon="mdi:map-marker",
        value_fn=get_location,
    ),
    WebdockSensorEntityDescription(
        key="profile",
        name="Profile",
        icon="mdi:card-account-details",
        value_fn=lambda data: f"{get_cpu_cores(data)} vCPU / {get_ram_gb(data)} GB RAM" if get_cpu_cores(data) is not None else data.get("profile") or data.get("profileSlug"),
    ),
    WebdockSensorEntityDescription(
        key="cpu_cores",
        name="CPU Cores",
        icon="mdi:cpu-64-bit",
        value_fn=get_cpu_cores,
    ),
    WebdockSensorEntityDescription(
        key="ram_size",
        name="RAM Size",
        native_unit_of_measurement=UnitOfInformation.GIBIBYTES,
        device_class=SensorDeviceClass.DATA_SIZE,
        icon="mdi:memory",
        value_fn=get_ram_gb,
    ),
    WebdockSensorEntityDescription(
        key="disk_size",
        name="Disk Size",
        native_unit_of_measurement=UnitOfInformation.GIBIBYTES,
        device_class=SensorDeviceClass.DATA_SIZE,
        icon="mdi:harddisk",
        value_fn=get_disk_gb,
    ),
    WebdockSensorEntityDescription(
        key="image",
        name="OS Image",
        icon="mdi:linux",
        value_fn=get_os_image,
    ),
    WebdockSensorEntityDescription(
        key="created",
        name="Created Date",
        device_class=SensorDeviceClass.TIMESTAMP,
        icon="mdi:calendar-clock",
        value_fn=lambda data: dt_util.parse_datetime(data.get("date") or data.get("created")) if data.get("date") or data.get("created") else None,
    ),
    WebdockSensorEntityDescription(
        key="cpu_usage",
        name="CPU Usage",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:cpu-64-bit",
        suggested_display_precision=1,
        value_fn=get_cpu_percent,
    ),
    WebdockSensorEntityDescription(
        key="memory_usage",
        name="Memory Usage",
        native_unit_of_measurement=UnitOfInformation.GIBIBYTES,
        device_class=SensorDeviceClass.DATA_SIZE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:memory",
        suggested_display_precision=2,
        value_fn=lambda data: mib_to_gib(
            get_metric_amount(data, "memory", "latestUsageSampling")
        ),
    ),
    WebdockSensorEntityDescription(
        key="disk_usage",
        name="Disk Usage",
        native_unit_of_measurement=UnitOfInformation.GIBIBYTES,
        device_class=SensorDeviceClass.DATA_SIZE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:harddisk",
        suggested_display_precision=2,
        value_fn=lambda data: mib_to_gib(
            get_metric_amount(data, "disk", "lastSamplings")
        ),
    ),
    WebdockSensorEntityDescription(
        key="network_usage",
        name="Monthly Network Usage",
        native_unit_of_measurement=UnitOfInformation.GIBIBYTES,
        device_class=SensorDeviceClass.DATA_SIZE,
        state_class=SensorStateClass.TOTAL_INCREASING,
        icon="mdi:swap-vertical-bold",
        value_fn=lambda data: (data.get("_metrics") or {}).get("network", {}).get("total"),
    ),
    WebdockSensorEntityDescription(
        key="network_allowance",
        name="Monthly Network Allowance",
        native_unit_of_measurement=UnitOfInformation.GIBIBYTES,
        device_class=SensorDeviceClass.DATA_SIZE,
        icon="mdi:gauge",
        value_fn=lambda data: (data.get("_metrics") or {}).get("network", {}).get("allowed"),
    ),
    WebdockSensorEntityDescription(
        key="network_ingress",
        name="Network Ingress",
        native_unit_of_measurement=UnitOfInformation.MEBIBYTES,
        device_class=SensorDeviceClass.DATA_SIZE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:download-network-outline",
        value_fn=lambda data: get_metric_amount(
            data, "network", "latestIngressSampling"
        ),
    ),
    WebdockSensorEntityDescription(
        key="network_egress",
        name="Network Egress",
        native_unit_of_measurement=UnitOfInformation.MEBIBYTES,
        device_class=SensorDeviceClass.DATA_SIZE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:upload-network-outline",
        value_fn=lambda data: get_metric_amount(
            data, "network", "latestEgressSampling"
        ),
    ),
    WebdockSensorEntityDescription(
        key="processes",
        name="Processes",
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:application-cog-outline",
        value_fn=lambda data: get_metric_amount(
            data, "processes", "latestProcessesSampling"
        ),
    ),
    WebdockSensorEntityDescription(
        key="last_checked",
        name="Last Checked",
        device_class=SensorDeviceClass.TIMESTAMP,
        icon="mdi:clock-check-outline",
        value_fn=lambda data: dt_util.parse_datetime(data.get("lastChecked")) if data.get("lastChecked") else None,
    ),
    WebdockSensorEntityDescription(
        key="virtualization",
        name="Virtualization",
        icon="mdi:cube-outline",
        value_fn=lambda data: data.get("virtualization"),
    ),
    WebdockSensorEntityDescription(
        key="web_server",
        name="Web Server",
        icon="mdi:web",
        value_fn=lambda data: data.get("webServer"),
    ),
    WebdockSensorEntityDescription(
        key="primary_domain",
        name="Primary Domain",
        icon="mdi:domain",
        value_fn=lambda data: (data.get("aliases") or [None])[0],
    ),
]


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Webdock VPS sensors."""
    coordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
    
    known_slugs: set[str] = set()

    def add_new_servers() -> None:
        new_slugs = set(coordinator.data) - known_slugs
        if not new_slugs:
            return
        async_add_entities(
            WebdockSensor(coordinator, slug, description)
            for slug in new_slugs
            for description in SENSOR_DESCRIPTIONS
        )
        known_slugs.update(new_slugs)

    add_new_servers()
    entry.async_on_unload(coordinator.async_add_listener(add_new_servers))


class WebdockSensor(WebdockEntity, SensorEntity):
    """Representation of a Webdock VPS sensor."""

    entity_description: WebdockSensorEntityDescription

    def __init__(
        self,
        coordinator,
        server_slug: str,
        description: WebdockSensorEntityDescription,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, server_slug)
        self.entity_description = description
        self._attr_unique_id = f"{server_slug}_{description.key}"

    @property
    def native_value(self) -> Any:
        """Return the state of the sensor."""
        return self.entity_description.value_fn(self.server_data)

    @property
    def extra_state_attributes(self) -> dict:
        """Expose identifiers used by the bundled dashboard card."""
        return {
            **super().extra_state_attributes,
            "webdock_sensor_key": self.entity_description.key,
        }
