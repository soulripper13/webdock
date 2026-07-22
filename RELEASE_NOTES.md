# v1.0.0 - Initial release

The first public release of Webdock VPS for Home Assistant.

## Integration

- UI-based setup using a Webdock API token.
- Automatic discovery of all VPS instances available to the account.
- Separate Home Assistant devices for discovered servers.
- Start, Stop, and Reboot controls.
- Dynamic discovery of servers created after Home Assistant starts.
- Configurable polling interval.

## Monitoring

- Server status, IPv4, IPv6, location, profile, image, CPU cores, RAM, and disk capacity.
- Current CPU, memory, disk, network ingress, network egress, and process metrics.
- Monthly network transfer usage and allowance.
- Creation time, last metrics check, virtualization type, web server, and primary domain.
- Pending-deletion warning.

## Dashboard card

- Bundled `custom:webdock-card` with automatic resource registration.
- Circular CPU, RAM, and disk gauges.
- Monthly transfer progress with allowance, remaining quota, ingress, and egress.
- Start/Stop and Reboot actions with confirmations and error notifications.
- Visual controls for colors, sizing, padding, visible sections, and entity overrides.
- Responsive layouts for mobile and desktop dashboards.

## Installation notes

Install through HACS or copy `custom_components/webdock` manually, then restart Home Assistant. If the bundled card does not appear after installation, hard-refresh the browser and verify `/webdock/webdock-card.js` is registered as a JavaScript module.
