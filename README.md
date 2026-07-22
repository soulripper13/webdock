# Webdock VPS for Home Assistant

[![HACS validation](https://github.com/soulripper13/webdock/actions/workflows/hacs.yaml/badge.svg)](https://github.com/soulripper13/webdock/actions/workflows/hacs.yaml)
[![Hassfest](https://github.com/soulripper13/webdock/actions/workflows/hassfest.yaml/badge.svg)](https://github.com/soulripper13/webdock/actions/workflows/hassfest.yaml)
[![GitHub release](https://img.shields.io/github/v/release/soulripper13/webdock)](https://github.com/soulripper13/webdock/releases)
[![License](https://img.shields.io/github/license/soulripper13/webdock)](LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/soulripper13/webdock)](https://github.com/soulripper13/webdock/issues)

A Home Assistant custom integration for monitoring and controlling Webdock VPS instances through the Webdock REST API.

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=soulripper13&repository=webdock&category=integration)
[![Add integration](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=webdock)

## Features

- Discovers all servers available to one Webdock account.
- Exposes each server as a separate Home Assistant device.
- Starts, stops, and reboots servers.
- Tracks status, IPv4, IPv6, location, profile, image, CPU cores, RAM, and disk capacity.
- Tracks current CPU, memory, disk, process, ingress, and egress metrics.
- Tracks monthly network transfer usage and allowance.
- Reports virtualization, web server, primary domain, creation time, last metrics check, and pending deletion.
- Includes a responsive dashboard card with a visual editor.

## Installation

### HACS

Until the repository is accepted into the HACS default list, add it as a custom repository:

1. Open HACS.
2. Open the menu and select **Custom repositories**.
3. Add `https://github.com/soulripper13/webdock` with category **Integration**.
4. Search for **Webdock VPS Control** and select **Download**.
5. Restart Home Assistant.

After default-list acceptance, the custom-repository step is no longer required.

### Manual

Copy `custom_components/webdock` into the `custom_components` directory in your Home Assistant configuration, then restart Home Assistant.

## Configuration

1. Open **Settings > Devices & services**.
2. Select **Add integration**.
3. Search for **Webdock VPS**.
4. Enter a Webdock API token.

Create the token in the Webdock dashboard under **Account Area > API & Integrations**. It needs server read permission for monitoring and server write permission for power controls. Store it securely and never include it in logs or issue reports.

The integration options allow a polling interval from 10 to 3600 seconds. The default is 60 seconds. Every update requests server details and current metrics, so accounts with many servers should use a longer interval to remain within Webdock's API rate limit.

## Entities

Each discovered VPS includes:

| Type | Entities |
| --- | --- |
| Controls | Power switch, Reboot button |
| Utilization | CPU, memory, disk, processes |
| Transfer | Monthly usage, monthly allowance, ingress, egress |
| Network | IPv4, IPv6, location, primary domain |
| Server | Status, profile, CPU cores, RAM size, disk size, image |
| Diagnostics | Virtualization, web server, created date, last checked, pending deletion |

Metric entities can be unavailable while a server is stopped or when the API token does not permit metrics access. Other servers continue updating if a single metrics request fails.

## Dashboard card

The bundled `custom:webdock-card` is registered automatically. If automatic registration is unavailable, add `/webdock/webdock-card.js` as a JavaScript module under **Settings > Dashboards > Resources**.

Add the card through the dashboard card picker and use its visual editor, or configure it in YAML:

```yaml
type: custom:webdock-card
server_slug: my-vps-slug
title: Production VPS
subtitle: Webdock
accent_color: "#0088cc"
background_color: "#1c1c1e"
gauge_size: 96
gauge_thickness: 5
card_padding: 16
show_cpu: true
show_ram: true
show_disk: true
show_bandwidth: true
show_details: true
show_actions: true
```

The editor also provides individual visibility switches and entity overrides for renamed or replacement entities.

## Troubleshooting

### Authentication fails

Generate a new token and verify that it has server read permission. Start, Stop, and Reboot also require server write permission.

### Metrics are unavailable

Metrics may be unavailable for stopped or newly provisioned servers. Verify the token permissions and wait for the next coordinator update.

### The dashboard card is missing or outdated

Restart Home Assistant after upgrading. Confirm `/webdock/webdock-card.js` is registered as a JavaScript module, then hard-refresh the browser.

### Debug logging

```yaml
logger:
  default: info
  logs:
    custom_components.webdock: debug
```

Remove tokens and public IP addresses before sharing logs.

## Releases

Install tagged GitHub releases rather than development snapshots. Release highlights and upgrade notes are maintained in [RELEASE_NOTES.md](RELEASE_NOTES.md).

## Support

Report reproducible bugs through [GitHub Issues](https://github.com/soulripper13/webdock/issues). Include the Home Assistant version, integration version, server status, relevant sanitized logs, and reproduction steps.

## License and trademarks

This project is licensed under the [MIT License](LICENSE). Webdock is a trademark of its respective owner. This community integration is not affiliated with or endorsed by Webdock.
