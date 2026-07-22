import asyncio
import logging
from typing import Any

import aiohttp

_LOGGER = logging.getLogger(__name__)

class WebdockError(Exception):
    """Base exception for Webdock API."""

class CannotConnect(WebdockError):
    """Exception to indicate connection failure."""

class InvalidAuth(WebdockError):
    """Exception to indicate authentication failure."""

class WebdockAPI:
    """Client wrapper for Webdock VPS REST API."""

    def __init__(self, session: aiohttp.ClientSession, token: str):
        """Initialize the API client."""
        self.session = session
        self.token = str(token).strip()
        self.base_url = "https://api.webdock.io/v1"

    async def _request(
        self, method: str, endpoint: str, json_data: dict | None = None
    ) -> Any:
        """Perform a request to the API."""
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/json",
            "X-Application": "Home Assistant Webdock Integration/1.0",
        }
        url = f"{self.base_url}/{endpoint}"
        try:
            async with self.session.request(method, url, headers=headers, json=json_data, timeout=20) as response:
                if response.status in (401, 403):
                    raise InvalidAuth("Authentication failed (invalid API token)")
                if not 200 <= response.status < 300:
                    try:
                        err_data = await response.json(content_type=None)
                        msg = err_data.get("message", f"HTTP error {response.status}")
                    except Exception:
                        msg = f"HTTP error {response.status}"
                    raise WebdockError(msg)
                
                if response.status == 204:
                    return {}
                body = await response.read()
                if not body:
                    return {}
                return await response.json(content_type=None)
        except aiohttp.ClientError as err:
            raise CannotConnect(f"Connection error: {err}") from err
        except asyncio.TimeoutError as err:
            raise CannotConnect(f"Timeout error: {err}") from err
        except WebdockError:
            raise
        except Exception as err:
            raise WebdockError(f"Unexpected error: {err}") from err

    async def get_servers(self) -> list:
        """Get the list of all servers."""
        res = await self._request("GET", "servers")
        if isinstance(res, list):
            return res
        if isinstance(res, dict):
            return res.get("servers", []) or res.get("body", []) or []
        return []

    async def get_server(self, slug: str) -> dict:
        """Get details of a specific server."""
        return await self._request("GET", f"servers/{slug}")

    async def start(self, slug: str) -> dict:
        """Start a server."""
        return await self._request("POST", f"servers/{slug}/actions/start")

    async def stop(self, slug: str) -> dict:
        """Stop a server."""
        return await self._request("POST", f"servers/{slug}/actions/stop")

    async def reboot(self, slug: str) -> dict:
        """Reboot a server."""
        return await self._request("POST", f"servers/{slug}/actions/reboot")

    async def get_instant_metrics(self, slug: str) -> dict:
        """Get the most recent utilization metrics for a server."""
        result = await self._request("GET", f"servers/{slug}/metrics/now")
        if isinstance(result, dict):
            return result.get("body", result)
        return {}
