"""Data update coordinator for the Webdock VPS integration."""
import asyncio
from datetime import timedelta
import logging

from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .api import WebdockAPI, CannotConnect, InvalidAuth, WebdockError

_LOGGER = logging.getLogger(__name__)

class WebdockDataUpdateCoordinator(DataUpdateCoordinator):
    """Class to manage fetching Webdock VPS data."""

    def __init__(self, hass: HomeAssistant, api: WebdockAPI, scan_interval: int) -> None:
        """Initialize the coordinator."""
        self.api = api
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=scan_interval),
        )

    async def _async_update_data(self) -> dict[str, dict]:
        """Fetch data from Webdock VPS REST API and index by server slug."""
        try:
            servers = await self.api.get_servers()
            valid_servers = [server for server in servers if server.get("slug")]

            details = await asyncio.gather(
                *(self.api.get_server(server["slug"]) for server in valid_servers),
                return_exceptions=True,
            )
            metrics = await asyncio.gather(
                *(self.api.get_instant_metrics(server["slug"]) for server in valid_servers),
                return_exceptions=True,
            )

            indexed_data = {}
            for list_server, detail_result, metrics_result in zip(
                valid_servers, details, metrics
            ):
                slug = list_server["slug"]
                detail = detail_result
                if isinstance(detail_result, Exception):
                    _LOGGER.debug("Could not fetch details for %s: %s", slug, detail_result)
                    detail = {}
                elif isinstance(detail_result, dict):
                    detail = detail_result.get(
                        "body", detail_result.get("server", detail_result)
                    )

                data = {**list_server, **(detail if isinstance(detail, dict) else {})}
                if isinstance(metrics_result, Exception):
                    _LOGGER.debug("Could not fetch metrics for %s: %s", slug, metrics_result)
                elif isinstance(metrics_result, dict):
                    data["_metrics"] = metrics_result
                indexed_data[slug] = data

            return indexed_data
        except CannotConnect as err:
            raise UpdateFailed(f"Error communicating with Webdock API: {err}") from err
        except InvalidAuth as err:
            raise UpdateFailed(f"Authentication failed for Webdock API: {err}") from err
        except WebdockError as err:
            raise UpdateFailed(f"Webdock API returned error: {err}") from err
        except Exception as err:
            raise UpdateFailed(f"Unexpected error fetching Webdock data: {err}") from err
