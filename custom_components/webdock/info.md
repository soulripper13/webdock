# Webdock VPS

Monitor and control Webdock virtual servers from Home Assistant.

## Highlights

- Discovers every VPS available to the configured Webdock API token.
- Tracks status, addresses, server specifications, CPU, memory, disk, network transfer, and process count.
- Provides Start/Stop and Reboot controls.
- Reports pending deletion and current server metadata.
- Includes a responsive, visually configurable dashboard card.

## Setup

After installing and restarting Home Assistant, open **Settings > Devices & services > Add integration**, search for **Webdock VPS**, and enter a Webdock API token.

The token needs read access to servers and write access to servers if power controls will be used. Treat the token as a password.

See the repository README for installation, card configuration, troubleshooting, and release information.
