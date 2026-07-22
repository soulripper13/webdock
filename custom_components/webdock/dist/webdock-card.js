class WebdockCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>
          :host {
            --card-padding: 16px;
            --gauge-size: 96px;
            --gauge-border: 5px;
            --primary-accent: var(--webdock-accent, #0088cc);
            --success-color: #4caf50;
            --warning-color: #ff9800;
            --danger-color: #f44336;
            display: block;
            container-type: inline-size;
          }

          ha-card {
            overflow: hidden;
            padding: var(--card-padding);
            background: var(--webdock-background, var(--card-background-color, #1c1c1e));
            border-radius: var(--ha-card-border-radius, 12px);
            border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #2c2c2e));
            box-shadow: var(--ha-card-box-shadow, none);
            color: var(--primary-text-color, #ffffff);
            font-family: var(--paper-font-body1_-_font-family, inherit);
            position: relative;
          }

          .card-content {
            display: flex;
            flex-direction: column;
          }

          .gauges-container { order: 2; }
          .bandwidth-section { order: 3; }
          .warning-banner { order: 4; }
          .grid-info { order: 5; }
          .actions { order: 6; }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
          }

          .title-container {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .title {
            font-size: 1.25rem;
            font-weight: bold;
            color: var(--primary-text-color);
            overflow-wrap: anywhere;
          }

          .subtitle {
            font-size: 0.85rem;
            color: var(--secondary-text-color, #8e8e93);
            margin-top: 2px;
          }

          .status-badge {
            display: flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            flex: 0 0 auto;
            margin-left: 12px;
          }

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 6px;
            background: var(--secondary-text-color);
          }

          .status-badge.running .status-dot,
          .status-badge.active .status-dot {
            background: var(--success-color);
            box-shadow: 0 0 8px var(--success-color);
            animation: pulse 2s infinite;
          }

          .status-badge.stopped .status-dot {
            background: var(--danger-color);
          }

          .status-badge.provisioning .status-dot {
            background: var(--warning-color);
            animation: pulse 1s infinite;
          }

          .status-badge.starting .status-dot,
          .status-badge.rebooting .status-dot,
          .status-badge.stopping .status-dot,
          .status-badge.reinstalling .status-dot {
            background: var(--warning-color);
            animation: pulse 1s infinite;
          }

          .status-badge.error .status-dot {
            background: var(--danger-color);
          }

          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.5; }
          }

          .grid-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }

          .info-item {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 10px;
            display: flex;
            flex-direction: column;
          }

          .info-label {
            font-size: 0.75rem;
            color: var(--secondary-text-color);
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0;
          }

          .info-value {
            font-size: 0.9rem;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .warning-banner {
            display: none;
            align-items: center;
            gap: 8px;
            margin: 0 0 20px;
            padding: 9px 10px;
            border: 1px solid color-mix(in srgb, var(--warning-color) 40%, transparent);
            border-radius: 6px;
            background: color-mix(in srgb, var(--warning-color) 12%, transparent);
            color: var(--primary-text-color);
            font-size: 0.82rem;
          }

          .gauges-container {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            align-items: start;
            gap: 16px;
            margin-bottom: 20px;
          }

          .gauge-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 0;
          }

          .gauge {
            position: relative;
            width: min(var(--gauge-size), 100%);
            aspect-ratio: 1;
            flex: 0 0 auto;
          }

          .gauge svg {
            width: 100%;
            height: 100%;
            transform: rotate(-90deg);
          }

          .gauge circle {
            fill: none;
            stroke-width: var(--gauge-border);
          }

          .gauge .track {
            stroke: rgba(255, 255, 255, 0.05);
          }

          .gauge .fill {
            stroke: var(--primary-accent);
            stroke-linecap: round;
            transition: stroke-dasharray 0.6s ease;
          }

          .gauge .value {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 1.05rem;
            font-weight: bold;
          }

          .gauge-label {
            margin-top: 8px;
            color: var(--secondary-text-color);
            font-size: 0.85rem;
            font-weight: 500;
            text-align: center;
          }

          .bandwidth-section {
            margin-bottom: 20px;
            padding: 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.02);
          }

          .bandwidth-header,
          .bandwidth-meta {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            color: var(--secondary-text-color);
            font-size: 0.8rem;
          }

          .bandwidth-header {
            margin-bottom: 6px;
          }

          .bandwidth-header span:first-child {
            color: var(--primary-text-color);
            font-weight: 500;
          }

          .bandwidth-meta {
            margin-top: 8px;
            font-size: 0.75rem;
          }

          .progress-bar-container {
            width: 100%;
            height: 8px;
            overflow: hidden;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.05);
          }

          .progress-bar {
            width: 0;
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, var(--primary-accent), #00bcd4);
            transition: width 0.6s ease;
          }

          .action-btn {
            flex: 1 1 92px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px;
            border-radius: 8px;
            border: none;
            background: rgba(255, 255, 255, 0.05);
            color: var(--primary-text-color);
            font-weight: 500;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid rgba(255, 255, 255, 0.08);
          }

          .action-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.15);
          }

          .action-btn:disabled {
            cursor: wait;
            opacity: 0.55;
          }

          .action-btn.btn-power.on {
            background: rgba(244, 67, 54, 0.15);
            color: var(--danger-color);
            border: 1px solid rgba(244, 67, 54, 0.3);
          }

          .action-btn.btn-power.on:hover {
            background: rgba(244, 67, 54, 0.25);
          }

          .action-btn.btn-power.off {
            background: rgba(76, 175, 80, 0.15);
            color: var(--success-color);
            border: 1px solid rgba(76, 175, 80, 0.3);
          }

          .action-btn.btn-power.off:hover {
            background: rgba(76, 175, 80, 0.25);
          }

          @container (max-width: 300px) {
            .header { align-items: flex-start; gap: 12px; }
            .grid-info { grid-template-columns: 1fr; }
            #os-info-item { grid-column: auto !important; }
            #domain-info-item { grid-column: auto !important; }
            .gauges-container { grid-template-columns: 1fr; }
            .status-badge { margin-left: 0; }
            .bandwidth-meta { flex-direction: column; gap: 4px; }
          }
        </style>
        <ha-card>
          <div class="card-content">
            <div class="header">
              <div class="title-container">
                <div class="title" id="card-title">Webdock VPS</div>
                <div class="subtitle" id="card-subtitle">Connecting...</div>
              </div>
              <div class="status-badge" id="status-badge">
                <span class="status-dot"></span>
                <span id="status-text">Offline</span>
              </div>
            </div>

            <div class="warning-banner" id="deletion-warning">
              <ha-icon icon="mdi:alert-outline"></ha-icon>
              <span>This server is scheduled for deletion.</span>
            </div>

            <div class="grid-info">
              <div class="info-item" id="ip-info-item">
                <div class="info-label">IPv4 Address</div>
                <div class="info-value" id="ip-val">-</div>
              </div>
              <div class="info-item" id="ip6-info-item">
                <div class="info-label">IPv6 Address</div>
                <div class="info-value" id="ip6-val">-</div>
              </div>
              <div class="info-item" id="profile-info-item">
                <div class="info-label">Profile Plan</div>
                <div class="info-value" id="profile-val">-</div>
              </div>
              <div class="info-item" id="location-info-item">
                <div class="info-label">Location</div>
                <div class="info-value" id="loc-val">-</div>
              </div>
              <div class="info-item" id="os-info-item" style="grid-column: span 2;">
                <div class="info-label">Operating System Stack</div>
                <div class="info-value" id="os-val">-</div>
              </div>
              <div class="info-item" id="virtualization-info-item">
                <div class="info-label">Virtualization</div>
                <div class="info-value">-</div>
              </div>
              <div class="info-item" id="web-server-info-item">
                <div class="info-label">Web Server</div>
                <div class="info-value">-</div>
              </div>
              <div class="info-item" id="domain-info-item" style="grid-column: span 2;">
                <div class="info-label">Primary Domain</div>
                <div class="info-value">-</div>
              </div>
            </div>

            <div class="gauges-container" id="gauges-container">
              <div class="gauge-wrapper" id="cpu-gauge-wrapper">
                <div class="gauge">
                  <svg viewBox="-2 -2 40 40" aria-hidden="true">
                    <circle class="track" cx="18" cy="18" r="15.915"></circle>
                    <circle class="fill" id="cpu-fill" cx="18" cy="18" r="15.915" stroke-dasharray="0, 100"></circle>
                  </svg>
                  <div class="value" id="cpu-val">0%</div>
                </div>
                <div class="gauge-label">CPU Usage</div>
              </div>
              <div class="gauge-wrapper" id="ram-gauge-wrapper">
                <div class="gauge">
                  <svg viewBox="-2 -2 40 40" aria-hidden="true">
                    <circle class="track" cx="18" cy="18" r="15.915"></circle>
                    <circle class="fill" id="ram-fill" cx="18" cy="18" r="15.915" stroke-dasharray="0, 100"></circle>
                  </svg>
                  <div class="value" id="ram-val">0%</div>
                </div>
                <div class="gauge-label">RAM Usage</div>
              </div>
              <div class="gauge-wrapper" id="disk-gauge-wrapper">
                <div class="gauge">
                  <svg viewBox="-2 -2 40 40" aria-hidden="true">
                    <circle class="track" cx="18" cy="18" r="15.915"></circle>
                    <circle class="fill" id="disk-fill" cx="18" cy="18" r="15.915" stroke-dasharray="0, 100"></circle>
                  </svg>
                  <div class="value" id="disk-val">0%</div>
                </div>
                <div class="gauge-label">Disk Usage</div>
              </div>
            </div>

            <div class="bandwidth-section" id="bandwidth-section">
              <div class="bandwidth-header">
                <span>Monthly Data Usage</span>
                <span id="bandwidth-text">0 / 0 GiB (0%)</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar" id="bandwidth-bar"></div>
              </div>
              <div class="bandwidth-meta">
                <span id="bandwidth-remaining"></span>
                <span id="process-summary">Processes: -</span>
              </div>
            </div>

            <div class="actions" id="actions-container">
              <button class="action-btn btn-power" id="btn-power">
                <ha-icon icon="mdi:power"></ha-icon>
                <span id="btn-power-text">Toggle</span>
              </button>
              <button class="action-btn" id="btn-reboot">
                <ha-icon icon="mdi:restart"></ha-icon>
                <span>Reboot</span>
              </button>
            </div>
          </div>
        </ha-card>
      `;
      this.content = shadow.getElementById('card-title').parentElement.parentElement;
    }
    this.updateCard();
  }

  setConfig(config) {
    this.config = config;
    this.slugConfigured = !!config.server_slug;
    this.updateCard();
  }

  findEntity(domain, key) {
    const states = this._hass.states;
    const slug = this.config.server_slug;
    
    if (this.config[`entity_${key}`]) {
      return this.config[`entity_${key}`];
    }
    
    const exactAttributeMatch = Object.keys(states).find(id => {
      const state = states[id];
      return id.startsWith(domain + '.') &&
        state.attributes.webdock_server_slug === slug &&
        (state.attributes.webdock_sensor_key === key || id.toLowerCase().includes(key.toLowerCase()));
    });
    if (exactAttributeMatch) return exactAttributeMatch;

    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return Object.keys(states).find(id =>
      id.startsWith(domain + '.') &&
      id.toLowerCase().includes(normalizedSlug) &&
      id.toLowerCase().includes(key.toLowerCase())
    );
  }

  async callServiceAction(button, domain, service, data) {
    button.disabled = true;
    try {
      await this._hass.callService(domain, service, data);
    } catch (error) {
      const event = new Event('hass-notification', { bubbles: true, composed: true });
      event.detail = { message: error?.message || 'Webdock action failed' };
      this.dispatchEvent(event);
    } finally {
      button.disabled = false;
    }
  }

  updateCard() {
    if (!this._hass || !this.config) return;

    const root = this.shadowRoot;

    if (!this.slugConfigured) {
      root.getElementById('card-subtitle').innerText = "Configure Server Slug";
      root.getElementById('card-title').innerText = "Webdock VPS Card";
      root.getElementById('status-badge').style.display = 'none';
      root.querySelector('.grid-info').style.display = 'none';
      root.getElementById('gauges-container').style.display = 'none';
      root.getElementById('bandwidth-section').style.display = 'none';
      root.getElementById('deletion-warning').style.display = 'none';
      root.getElementById('actions-container').style.display = 'none';
      
      // Inject welcome banner
      let welcome = root.getElementById('welcome-banner');
      if (!welcome) {
        welcome = document.createElement('div');
        welcome.id = 'welcome-banner';
        welcome.innerHTML = `
          <style>
            .welcome-banner {
              padding: 24px 16px;
              text-align: center;
              background: rgba(255, 255, 255, 0.02);
              border: 1px dashed rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              margin-top: 10px;
            }
            .welcome-title {
              font-size: 1.1rem;
              font-weight: bold;
              color: var(--primary-accent, #0088cc);
              margin-bottom: 8px;
            }
            .welcome-text {
              font-size: 0.85rem;
              color: var(--secondary-text-color, #8e8e93);
            }
          </style>
          <div class="welcome-banner">
            <div class="welcome-title">Welcome to Webdock Card</div>
            <div class="welcome-text">Please enter your <strong>Server Slug</strong> in the visual editor or YAML config to begin monitoring.</div>
          </div>
        `;
        root.querySelector('.card-content').appendChild(welcome);
      }
      return;
    } else {
      // Remove welcome banner if present
      const welcome = root.getElementById('welcome-banner');
      if (welcome) welcome.remove();
      
      // Show layout containers
      root.getElementById('status-badge').style.display = 'flex';
      root.querySelector('.grid-info').style.display = this.config.show_details === false ? 'none' : 'grid';
      root.getElementById('gauges-container').style.display = 'grid';
      root.getElementById('bandwidth-section').style.display = 'block';
      root.getElementById('actions-container').style.display = this.config.show_actions === false ? 'none' : 'flex';
    }

    const states = this._hass.states;

    const powerEnt = this.findEntity('switch', 'power');
    const statusEnt = this.findEntity('sensor', 'status');
    const ipEnt = this.findEntity('sensor', 'ipv4');
    const ip6Ent = this.findEntity('sensor', 'ipv6');
    const locEnt = this.findEntity('sensor', 'location');
    const profileEnt = this.findEntity('sensor', 'profile');
    const osEnt = this.findEntity('sensor', 'image');
    const virtualizationEnt = this.findEntity('sensor', 'virtualization');
    const webServerEnt = this.findEntity('sensor', 'web_server');
    const domainEnt = this.findEntity('sensor', 'primary_domain');
    const cpuUsageEnt = this.findEntity('sensor', 'cpu_usage');
    const memoryUsageEnt = this.findEntity('sensor', 'memory_usage');
    const memorySizeEnt = this.findEntity('sensor', 'ram_size');
    const diskUsageEnt = this.findEntity('sensor', 'disk_usage');
    const diskSizeEnt = this.findEntity('sensor', 'disk_size');
    const networkUsageEnt = this.findEntity('sensor', 'network_usage');
    const networkAllowanceEnt = this.findEntity('sensor', 'network_allowance');
    const networkIngressEnt = this.findEntity('sensor', 'network_ingress');
    const networkEgressEnt = this.findEntity('sensor', 'network_egress');
    const processesEnt = this.findEntity('sensor', 'processes');
    const pendingDeletionEnt = this.findEntity('binary_sensor', 'pending_deletion');
    const rebootBtnEnt = this.findEntity('button', 'reboot');

    const powerState = powerEnt ? states[powerEnt] : null;
    const statusState = statusEnt ? states[statusEnt] : null;
    const ipState = ipEnt ? states[ipEnt] : null;
    const ip6State = ip6Ent ? states[ip6Ent] : null;
    const locState = locEnt ? states[locEnt] : null;
    const profileState = profileEnt ? states[profileEnt] : null;
    const osState = osEnt ? states[osEnt] : null;
    const virtualizationState = virtualizationEnt ? states[virtualizationEnt] : null;
    const webServerState = webServerEnt ? states[webServerEnt] : null;
    const domainState = domainEnt ? states[domainEnt] : null;
    const cpuUsageState = cpuUsageEnt ? states[cpuUsageEnt] : null;
    const memoryUsageState = memoryUsageEnt ? states[memoryUsageEnt] : null;
    const memorySizeState = memorySizeEnt ? states[memorySizeEnt] : null;
    const diskUsageState = diskUsageEnt ? states[diskUsageEnt] : null;
    const diskSizeState = diskSizeEnt ? states[diskSizeEnt] : null;
    const networkUsageState = networkUsageEnt ? states[networkUsageEnt] : null;
    const networkAllowanceState = networkAllowanceEnt ? states[networkAllowanceEnt] : null;
    const networkIngressState = networkIngressEnt ? states[networkIngressEnt] : null;
    const networkEgressState = networkEgressEnt ? states[networkEgressEnt] : null;
    const processesState = processesEnt ? states[processesEnt] : null;
    const pendingDeletionState = pendingDeletionEnt ? states[pendingDeletionEnt] : null;

    const friendlyName = powerState && powerState.attributes.friendly_name;
    root.getElementById('card-title').innerText = this.config.title || (friendlyName ? friendlyName.replace(' Power', '') : 'Webdock VPS');
    root.getElementById('card-subtitle').innerText = this.config.subtitle || `Slug: ${this.config.server_slug}`;

    const statusVal = statusState ? statusState.state.toLowerCase() : (powerState ? (powerState.state === 'on' ? 'running' : 'stopped') : 'unknown');
    const statusBadge = root.getElementById('status-badge');
    const statusText = root.getElementById('status-text');
    statusBadge.className = `status-badge ${statusVal}`;
    statusText.innerText = statusVal.toUpperCase();
    statusBadge.style.display = this.config.show_status === false ? 'none' : 'flex';

    const updateInfoItem = (id, stateObj, visible = true) => {
      const itemEl = root.getElementById(id);
      if (visible && stateObj && stateObj.state && !['unknown', 'unavailable'].includes(stateObj.state)) {
        itemEl.style.display = 'flex';
        itemEl.querySelector('.info-value').innerText = stateObj.state;
        itemEl.querySelector('.info-value').title = stateObj.state;
      } else {
        itemEl.style.display = 'none';
      }
    };

    const showDetails = this.config.show_details !== false;
    updateInfoItem('ip-info-item', ipState, showDetails && this.config.show_ipv4 !== false);
    updateInfoItem('ip6-info-item', ip6State, showDetails && this.config.show_ipv6 !== false);
    updateInfoItem('profile-info-item', profileState, showDetails && this.config.show_profile !== false);
    updateInfoItem('location-info-item', locState, showDetails && this.config.show_location !== false);
    updateInfoItem('os-info-item', osState, showDetails && this.config.show_os !== false);
    updateInfoItem('virtualization-info-item', virtualizationState, showDetails && this.config.show_virtualization !== false);
    updateInfoItem('web-server-info-item', webServerState, showDetails && this.config.show_web_server !== false);
    updateInfoItem('domain-info-item', domainState, showDetails && this.config.show_domain !== false);
    const detailsContainer = root.querySelector('.grid-info');
    const hasVisibleDetail = Array.from(detailsContainer.children)
      .some((item) => item.style.display !== 'none');
    detailsContainer.style.display = showDetails && hasVisibleDetail ? 'grid' : 'none';

    root.getElementById('deletion-warning').style.display =
      pendingDeletionState && pendingDeletionState.state === 'on' ? 'flex' : 'none';

    const validNumber = (stateObj) => {
      if (!stateObj || ['unknown', 'unavailable'].includes(stateObj.state)) return null;
      const value = Number(stateObj.state);
      return Number.isFinite(value) ? value : null;
    };
    const updateGauge = (key, valueState, maximumState, fixedMaximum, visible) => {
      const value = validNumber(valueState);
      const maximum = fixedMaximum ?? validNumber(maximumState);
      const percentage = value !== null && maximum > 0
        ? Math.max(0, Math.min(100, (value / maximum) * 100))
        : null;
      const wrapper = root.getElementById(`${key}-gauge-wrapper`);
      if (visible && percentage !== null) {
        wrapper.style.display = 'flex';
        root.getElementById(`${key}-val`).innerText = `${Math.round(percentage)}%`;
        const fill = root.getElementById(`${key}-fill`);
        fill.setAttribute('stroke-dasharray', `${percentage}, 100`);
        fill.style.stroke = percentage > 90
          ? 'var(--danger-color)'
          : percentage > 75 ? 'var(--warning-color)' : 'var(--primary-accent)';
      } else {
        wrapper.style.display = 'none';
      }
      return visible && percentage !== null;
    };

    const gaugesVisible = [
      updateGauge('cpu', cpuUsageState, null, 100, this.config.show_cpu !== false),
      updateGauge('ram', memoryUsageState, memorySizeState, null, this.config.show_ram !== false),
      updateGauge('disk', diskUsageState, diskSizeState, null, this.config.show_disk !== false),
    ].some(Boolean);
    root.getElementById('gauges-container').style.display = gaugesVisible ? 'grid' : 'none';

    const used = validNumber(networkUsageState);
    const allowance = validNumber(networkAllowanceState);
    const bandwidthSection = root.getElementById('bandwidth-section');
    if (this.config.show_bandwidth !== false && used !== null && allowance !== null) {
      bandwidthSection.style.display = 'block';
      const percentage = allowance > 0 ? Math.min(100, (used / allowance) * 100) : 0;
      root.getElementById('bandwidth-text').innerText = `${used} / ${allowance} GiB (${Math.round(percentage)}%)`;
      const ingress = validNumber(networkIngressState);
      const egress = validNumber(networkEgressState);
      const recentTraffic = ingress !== null && egress !== null
        ? ` | In ${ingress} / Out ${egress} MiB`
        : '';
      root.getElementById('bandwidth-remaining').innerText = `${Math.max(0, allowance - used).toFixed(1)} GiB remaining${recentTraffic}`;
      const bar = root.getElementById('bandwidth-bar');
      bar.style.width = `${percentage}%`;
      bar.style.background = percentage > 90
        ? 'var(--danger-color)'
        : percentage > 75 ? 'var(--warning-color)' : 'linear-gradient(90deg, var(--primary-accent), #00bcd4)';
    } else {
      bandwidthSection.style.display = 'none';
    }
    root.getElementById('process-summary').innerText =
      `Processes: ${processesState && !['unknown', 'unavailable'].includes(processesState.state) ? processesState.state : '-'}`;

    const btnPower = root.getElementById('btn-power');
    const btnPowerText = root.getElementById('btn-power-text');
    if (powerState && this.config.show_actions !== false && this.config.show_power !== false) {
      btnPower.style.display = 'flex';
      const isOn = powerState.state === 'on';
      btnPower.className = `action-btn btn-power ${isOn ? 'on' : 'off'}`;
      btnPowerText.innerText = isOn ? 'Stop' : 'Start';
      btnPower.onclick = async () => {
        if (isOn && !confirm(`Stop VPS ${this.config.server_slug}? Services running on it will become unavailable.`)) {
          return;
        }
        await this.callServiceAction(btnPower, 'switch', isOn ? 'turn_off' : 'turn_on', { entity_id: powerEnt });
      };
    } else {
      btnPower.style.display = 'none';
    }

    const btnReboot = root.getElementById('btn-reboot');
    if (rebootBtnEnt && this.config.show_actions !== false && this.config.show_reboot !== false) {
      btnReboot.style.display = 'flex';
      btnReboot.onclick = async () => {
        if (confirm(`Reboot VPS ${this.config.server_slug}? Services will be temporarily unavailable.`)) {
          await this.callServiceAction(btnReboot, 'button', 'press', { entity_id: rebootBtnEnt });
        }
      };
    } else {
      btnReboot.style.display = 'none';
    }

    const actionsContainer = root.getElementById('actions-container');
    const hasVisibleAction = [btnPower, btnReboot]
      .some((button) => button.style.display !== 'none');
    actionsContainer.style.display = this.config.show_actions !== false && hasVisibleAction ? 'flex' : 'none';

    const numberSetting = (value, fallback, min, max) => {
      const parsed = Number(value);
      return Math.min(max, Math.max(min, Number.isFinite(parsed) && value !== '' ? parsed : fallback));
    };
    this.style.setProperty('--card-padding', `${numberSetting(this.config.card_padding, 16, 0, 40)}px`);
    this.style.setProperty('--gauge-size', `${numberSetting(this.config.gauge_size, 96, 56, 160)}px`);
    this.style.setProperty('--gauge-border', `${numberSetting(this.config.gauge_thickness, 5, 2, 8)}px`);
    this.style.setProperty('--webdock-accent', this.config.accent_color || 'var(--primary-color, #0088cc)');
    this.style.setProperty('--webdock-background', this.config.background_color || 'var(--card-background-color, #1c1c1e)');
  }

  static getConfigElement() {
    return document.createElement("webdock-card-editor");
  }

  static getStubConfig() {
    return {
      server_slug: "",
      title: "",
      subtitle: "",
      show_cpu: true,
      show_ram: true,
      show_disk: true,
      show_bandwidth: true,
      show_status: true,
      show_details: true,
      show_ipv4: true,
      show_ipv6: true,
      show_profile: true,
      show_location: true,
      show_os: true,
      show_virtualization: true,
      show_web_server: true,
      show_domain: true,
      show_actions: true,
      show_power: true,
      show_reboot: true
    };
  }

  getCardSize() {
    return 5;
  }
}

customElements.define('webdock-card', WebdockCard);

class WebdockCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    if (this.content) this._updateEditor();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>
          .form-group {
            margin-bottom: 16px;
            display: flex;
            flex-direction: column;
          }
          label {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--primary-text-color, #ffffff);
            margin-bottom: 6px;
          }
          input[type="text"], input[type="number"], select, input[type="color"] {
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid var(--divider-color, #2c2c2e);
            background: var(--card-background-color, #1c1c1e);
            color: var(--primary-text-color, #ffffff);
            font-size: 0.9rem;
          }
          input[type="color"] {
            width: 100%;
            height: 40px;
            padding: 4px;
          }
          .section-title {
            margin: 20px 0 12px;
            color: var(--secondary-text-color, #8e8e93);
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
          }
          .number-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }
          .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }
          .checkbox-group label {
            margin-bottom: 0;
            cursor: pointer;
          }
        </style>
        <div class="card-config">
          <div class="form-group">
            <label for="server_slug">Server Slug (Required)</label>
            <select id="server_slug" config-value="server_slug"></select>
          </div>
          <div class="form-group">
            <label for="title">Title (Optional)</label>
            <input type="text" id="title" config-value="title">
          </div>
          <div class="form-group">
            <label for="subtitle">Subtitle (Optional)</label>
            <input type="text" id="subtitle" config-value="subtitle" placeholder="Slug: ...">
          </div>
          <div class="section-title">Appearance</div>
          <div class="form-group">
            <label for="accent_color">Accent Color (Optional)</label>
            <input type="color" id="accent_color" config-value="accent_color" value="#0088cc">
          </div>
          <div class="form-group">
            <label for="background_color">Background Color (Optional)</label>
            <input type="color" id="background_color" config-value="background_color" value="#1c1c1e">
          </div>
          <div class="number-grid">
            <div class="form-group">
              <label for="gauge_size">Gauge Size</label>
              <input type="number" id="gauge_size" config-value="gauge_size" min="56" max="160" step="4">
            </div>
            <div class="form-group">
              <label for="gauge_thickness">Gauge Width</label>
              <input type="number" id="gauge_thickness" config-value="gauge_thickness" min="2" max="8" step="1">
            </div>
            <div class="form-group">
              <label for="card_padding">Card Padding</label>
              <input type="number" id="card_padding" config-value="card_padding" min="0" max="40" step="2">
            </div>
          </div>
          <div class="section-title">Visible Sections</div>
          <div id="visibility-options"></div>
          <div class="section-title">Entity Overrides</div>
          <div id="entity-overrides"></div>
        </div>
      `;
      this.content = shadow.querySelector('.card-config');

      const visibilityOptions = [
        ['show_cpu', 'Show CPU Gauge'],
        ['show_ram', 'Show RAM Gauge'],
        ['show_disk', 'Show Disk Gauge'],
        ['show_bandwidth', 'Show Data Usage Bar'],
        ['show_status', 'Show Status'],
        ['show_details', 'Show Server Details'],
        ['show_ipv4', 'Show IPv4 Address'],
        ['show_ipv6', 'Show IPv6 Address'],
        ['show_profile', 'Show Profile'],
        ['show_location', 'Show Location'],
        ['show_os', 'Show Operating System'],
        ['show_virtualization', 'Show Virtualization'],
        ['show_web_server', 'Show Web Server'],
        ['show_domain', 'Show Primary Domain'],
        ['show_actions', 'Show Actions'],
        ['show_power', 'Show Start/Stop'],
        ['show_reboot', 'Show Reboot'],
      ];
      const visibilityContainer = shadow.getElementById('visibility-options');
      visibilityOptions.forEach(([key, labelText]) => {
        const group = document.createElement('div');
        group.className = 'checkbox-group';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = key;
        input.setAttribute('config-value', key);
        const label = document.createElement('label');
        label.htmlFor = key;
        label.textContent = labelText;
        group.append(input, label);
        visibilityContainer.appendChild(group);
      });

      const entityOverrides = [
        ['entity_status', 'Status Entity'],
        ['entity_cpu_usage', 'CPU Usage Entity'],
        ['entity_memory_usage', 'Memory Usage Entity'],
        ['entity_ram_size', 'RAM Size Entity'],
        ['entity_disk_usage', 'Disk Usage Entity'],
        ['entity_disk_size', 'Disk Size Entity'],
        ['entity_network_usage', 'Data Usage Entity'],
        ['entity_network_allowance', 'Data Allowance Entity'],
        ['entity_network_ingress', 'Network Ingress Entity'],
        ['entity_network_egress', 'Network Egress Entity'],
        ['entity_ipv4', 'IPv4 Entity'],
        ['entity_ipv6', 'IPv6 Entity'],
        ['entity_profile', 'Profile Entity'],
        ['entity_location', 'Location Entity'],
        ['entity_image', 'Operating System Entity'],
        ['entity_virtualization', 'Virtualization Entity'],
        ['entity_web_server', 'Web Server Entity'],
        ['entity_primary_domain', 'Primary Domain Entity'],
        ['entity_processes', 'Processes Entity'],
        ['entity_pending_deletion', 'Pending Deletion Entity'],
        ['entity_power', 'Start/Stop Entity'],
        ['entity_reboot', 'Reboot Entity'],
      ];
      const overrideContainer = shadow.getElementById('entity-overrides');
      entityOverrides.forEach(([key, labelText]) => {
        const group = document.createElement('div');
        group.className = 'form-group';
        const label = document.createElement('label');
        label.htmlFor = key;
        label.textContent = labelText;
        const input = document.createElement('input');
        input.type = 'text';
        input.id = key;
        input.setAttribute('config-value', key);
        input.placeholder = 'domain.webdock_...';
        group.append(label, input);
        overrideContainer.appendChild(group);
      });

      // Bind event listeners
      this.content.addEventListener('change', (ev) => this._valueChanged(ev));
      this.content.addEventListener('input', (ev) => this._valueChanged(ev));
    }

    this._updateEditor();
  }

  _updateEditor() {
    if (!this._config) return;
    const root = this.shadowRoot;

    const slugSelect = root.getElementById('server_slug');
    const slugs = [...new Set(Object.values(this._hass.states)
      .map((state) => state.attributes.webdock_server_slug)
      .filter(Boolean))].sort();
    if (this._config.server_slug && !slugs.includes(this._config.server_slug)) {
      slugs.unshift(this._config.server_slug);
    }
    slugSelect.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a server';
    slugSelect.appendChild(placeholder);
    slugs.forEach((slug) => {
      const option = document.createElement('option');
      option.value = slug;
      option.textContent = slug;
      slugSelect.appendChild(option);
    });
    
    const setVal = (id, val) => {
      const el = root.getElementById(id);
      if (el) el.value = val !== undefined ? val : '';
    };

    const setChecked = (id, val) => {
      const el = root.getElementById(id);
      if (el) el.checked = val !== false;
    };

    setVal('server_slug', this._config.server_slug);
    setVal('title', this._config.title);
    setVal('subtitle', this._config.subtitle);
    setVal('accent_color', this._config.accent_color || '#0088cc');
    setVal('background_color', this._config.background_color || '#1c1c1e');
    setVal('gauge_size', this._config.gauge_size || 96);
    setVal('gauge_thickness', this._config.gauge_thickness || 5);
    setVal('card_padding', this._config.card_padding ?? 16);
    [
      'show_cpu', 'show_ram', 'show_disk', 'show_bandwidth', 'show_status',
      'show_details', 'show_ipv4', 'show_ipv6', 'show_profile', 'show_location',
      'show_os', 'show_virtualization', 'show_web_server', 'show_domain',
      'show_actions', 'show_power', 'show_reboot',
    ].forEach((key) => setChecked(key, this._config[key]));
    [
      'entity_status', 'entity_cpu_usage', 'entity_memory_usage', 'entity_ram_size',
      'entity_disk_usage', 'entity_disk_size', 'entity_network_usage',
      'entity_network_allowance', 'entity_network_ingress', 'entity_network_egress',
      'entity_ipv4', 'entity_ipv6', 'entity_profile',
      'entity_location', 'entity_image', 'entity_virtualization',
      'entity_web_server', 'entity_primary_domain', 'entity_processes',
      'entity_pending_deletion', 'entity_power', 'entity_reboot',
    ].forEach((key) => setVal(key, this._config[key]));
  }

  _valueChanged(ev) {
    if (!this._config) return;
    const target = ev.target;
    const configKey = target.getAttribute('config-value');
    if (!configKey) return;

    const value = target.type === 'checkbox' ? target.checked : target.value;
    const newConfig = { ...this._config };
    
    if (value === '' || value === undefined) {
      delete newConfig[configKey];
    } else {
      newConfig[configKey] = value;
    }

    const event = new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}
customElements.define('webdock-card-editor', WebdockCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "webdock-card",
  name: "Webdock Card",
  preview: true,
  description: "A premium dashboard card for monitoring and controlling Webdock VPS instances.",
  documentationURL: "https://github.com/soulripper13/webdock",
});
