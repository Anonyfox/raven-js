# SOAR.md - Deployment Concept & Implementation Outline

## Purpose

**Soar** is the final strike in the RavenJS deployment chain. After **Fledge** transforms development applications into deployment artifacts (static files, script bundles, native binaries), **Soar** deploys these artifacts to production targets with surgical precision.

Soar operates at the **protocol and filesystem level** - it's completely language and framework agnostic. Whether your artifact comes from Rust, Go, Python, JavaScript, or any other technology, Soar deploys it using **zero external dependencies** and **pure platform primitives**.

## Core Philosophy (Following CODEX)

- **Zero Dependencies** - Uses only Node.js built-ins (`https`, `child_process`, `crypto`, `fs`)
- **Platform Mastery** - Native HTTP APIs, SSH protocols, no vendor SDKs
- **Algorithm Over Patches** - Clean deployment workflows, not configuration hacks
- **Universal Compatibility** - Deploys any artifact to any target
- **Surgical Precision** - One deployment type per module, clear separation of concerns

## Architecture Overview

### Package Structure

```
packages/soar/
├── bin/
│   └── soar.js                    # CLI entry point
├── src/
│   ├── config/
│   │   ├── config.js              # Main SoarConfig class
│   │   ├── import-config.js       # ESM import utilities (like Fledge)
│   │   ├── validation.js          # Config validation
│   │   └── resource-identity.js   # Universal resource naming
│   ├── providers/
│   │   ├── base/
│   │   │   ├── provider.js        # BaseProvider (HTTP client foundation)
│   │   │   ├── vps.js             # BaseVPS (droplet/instance operations)
│   │   │   ├── serverless.js      # BaseServerless (functions/workers)
│   │   │   └── static-host.js     # BaseStaticHost (pages/buckets)
│   │   ├── digitalocean/
│   │   │   ├── api.js             # DigitalOceanProvider
│   │   │   ├── droplets.js        # DigitalOceanVPS
│   │   │   └── functions.js       # DigitalOceanServerless
│   │   └── cloudflare/
│   │       ├── api.js             # CloudflareProvider
│   │       ├── pages.js           # CloudflareStaticHost
│   │       └── workers.js         # CloudflareServerless
│   ├── transports/
│   │   ├── ssh.js                 # SSH operations (child_process)
│   │   ├── scp.js                 # SCP file transfer
│   │   └── http.js                # HTTP uploads
│   ├── artifacts/
│   │   ├── binary.js              # Binary deployment logic
│   │   ├── script.js              # Script bundle deployment
│   │   └── static.js              # Static files deployment
│   ├── orchestration/
│   │   ├── planner.js             # Deployment planning (dry-run)
│   │   ├── deployment.js          # Main deployment orchestrator
│   │   ├── health-check.js        # Deployment verification
│   │   └── rollback.js            # Rollback strategies
│   └── state/
│       ├── resource-state.js      # Resource state tracking
│       └── metadata.js            # Deployment metadata
├── index.js                       # Main exports
├── package.json
└── README.md
```

## Supported Deployment Matrix

### Artifact Types × Transport Methods × Target Environments

| Artifact Type     | Transport | Target Environment   | Provider     | Use Case                 |
| ----------------- | --------- | -------------------- | ------------ | ------------------------ |
| **Binary**        | SSH/SCP   | VPS Droplet          | DigitalOcean | Rust/Go/C++ servers      |
| **Script Bundle** | HTTP API  | Serverless Functions | DigitalOcean | Node.js/Python functions |
| **Script Bundle** | HTTP API  | Workers              | Cloudflare   | Edge compute scripts     |
| **Static Files**  | HTTP API  | Pages                | Cloudflare   | React/Vue/Hugo sites     |

### Future Extensibility

The base class architecture allows easy addition of:

- **More VPS Providers**: AWS EC2, Linode, Vultr (extend BaseVPS)
- **More Static Hosts**: AWS S3+CloudFront, Netlify (extend BaseStaticHost)
- **More Serverless**: AWS Lambda, Vercel Functions (extend BaseServerless)

## Configuration System

### Config Loading Pattern (Following Fledge)

Soar uses the same config loading precedence as Fledge:

1. **Piped input** (highest priority)
2. **Config file** (second priority)
3. **Named exports** (third priority)
4. **CLI flags** (lowest priority)

### Configuration Schema

```javascript
// soar.config.js
export default {
  resource: {
    name: "my-app-prod", // REQUIRED: Universal identifier (DNS-safe)
    description: "Production app server",
  },
  artifact: {
    type: "binary", // 'binary' | 'script' | 'static'
    path: "./dist/myapp", // Path to deployment artifact
  },
  target: {
    provider: "digitalocean", // 'digitalocean' | 'cloudflare'
    type: "droplet", // 'droplet' | 'functions' | 'workers' | 'pages'
    config: {
      region: "nyc3", // Provider-specific config
      size: "s-1vcpu-2gb",
      image: "ubuntu-22-04-x64",
    },
  },
  transport: "ssh", // 'ssh' | 'scp' | 'http'
  deployment: {
    healthCheck: "/health", // Health check endpoint
    timeout: 300, // Deployment timeout (seconds)
    retries: 3, // Retry attempts
    serviceName: "myapp", // Systemd service name (for binaries)
  },
};

// Named exports for different environments
export const production = {
  resource: { name: "myapp-prod" },
  target: {
    provider: "digitalocean",
    type: "droplet",
    config: { region: "nyc1", size: "s-2vcpu-4gb" },
  },
};

export const staging = {
  resource: { name: "myapp-staging" },
  target: {
    provider: "digitalocean",
    type: "droplet",
    config: { region: "nyc3", size: "s-1vcpu-1gb" },
  },
};
```

## Universal Resource Identity

### Resource Naming Rules

Every resource must have a **universal identifier** that works across all providers:

```javascript
// Resource name validation rules
export class ResourceIdentity {
  static validate(name) {
    // 1. Required and string
    if (!name || typeof name !== "string") {
      throw new Error("Resource name is required");
    }

    // 2. Length constraints (DNS compatible)
    if (name.length < 3 || name.length > 63) {
      throw new Error("Resource name must be 3-63 characters");
    }

    // 3. Character constraints (DNS-safe)
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name)) {
      throw new Error(
        "Resource name must be lowercase alphanumeric with hyphens (no leading/trailing hyphens)"
      );
    }

    // 4. Reserved name prevention
    const reserved = ["api", "www", "admin", "root", "mail", "ftp"];
    if (reserved.includes(name)) {
      throw new Error(`Resource name '${name}' is reserved`);
    }

    return true;
  }
}
```

### Why Universal Names Matter

- **Cross-provider compatibility** - Same name works on DO, CF, AWS, etc.
- **State tracking** - Can find existing resources via API calls
- **Dry-run accuracy** - Planning phase can detect conflicts
- **DNS compatibility** - Names can become subdomains if needed

## Environment Variables & Secrets

### Required Environment Variables

All secrets must be passed via environment variables or `.env` files. **Never hardcode credentials.**

#### DigitalOcean Provider

```bash
# Required for all DigitalOcean operations
DO_TOKEN="dop_v1_your_digitalocean_api_token_here"

# Required for SSH operations to droplets
DO_SSH_KEY_PATH="/home/user/.ssh/id_rsa"
# Alternative: DO_SSH_KEY_CONTENT="-----BEGIN PRIVATE KEY-----..."
```

#### Cloudflare Provider

```bash
# Required for all Cloudflare operations
CF_API_TOKEN="your_cloudflare_api_token_here"

# Required for some operations (account-specific)
CF_ACCOUNT_ID="your_cloudflare_account_id"

# Required for zone-specific operations (Pages, DNS)
CF_ZONE_ID="your_cloudflare_zone_id"
```

### Environment Variable Loading

```javascript
// src/config/credentials.js
export class CredentialsLoader {
  static loadDigitalOcean() {
    const token = process.env.DO_TOKEN;
    if (!token) {
      throw new Error(
        "DO_TOKEN environment variable is required for DigitalOcean operations"
      );
    }

    const sshKeyPath = process.env.DO_SSH_KEY_PATH || "~/.ssh/id_rsa";
    const sshKeyContent = process.env.DO_SSH_KEY_CONTENT;

    return {
      token,
      sshKeyPath: sshKeyPath,
      sshKeyContent: sshKeyContent,
    };
  }

  static loadCloudflare() {
    const token = process.env.CF_API_TOKEN;
    if (!token) {
      throw new Error(
        "CF_API_TOKEN environment variable is required for Cloudflare operations"
      );
    }

    return {
      token,
      accountId: process.env.CF_ACCOUNT_ID,
      zoneId: process.env.CF_ZONE_ID,
    };
  }
}
```

## Base Class Architecture

### Base Provider (HTTP Client Foundation)

```javascript
// src/providers/base/provider.js
export class BaseProvider {
  constructor(credentials) {
    this.credentials = credentials;
    this.baseURL = null; // Set by subclass
    this.headers = {}; // Set by subclass
  }

  // Pure Node.js HTTPS - no external dependencies
  async request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseURL);
      const options = {
        method,
        headers: this.headers,
        timeout: 30000,
      };

      const req = https.request(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(
                new Error(`HTTP ${res.statusCode}: ${parsed.message || data}`)
              );
            }
          } catch (err) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on("error", reject);
      req.on("timeout", () => reject(new Error("Request timeout")));

      if (body) {
        req.write(typeof body === "string" ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  // Subclasses must implement
  authenticate() {
    throw new Error("authenticate() must be implemented");
  }
  validateCredentials() {
    throw new Error("validateCredentials() must be implemented");
  }
}
```

### Base VPS Operations

```javascript
// src/providers/base/vps.js
export class BaseVPS {
  constructor(provider) {
    this.provider = provider;
  }

  // Abstract methods - subclasses must implement
  async create(config) {
    throw new Error("create() must be implemented");
  }
  async destroy(instanceId) {
    throw new Error("destroy() must be implemented");
  }
  async list() {
    throw new Error("list() must be implemented");
  }
  async getStatus(instanceId) {
    throw new Error("getStatus() must be implemented");
  }
  async findByName(resourceName) {
    throw new Error("findByName() must be implemented");
  }

  // Common VPS operations - all providers need these
  async waitForReady(instanceId, timeout = 300) {
    const start = Date.now();
    while (Date.now() - start < timeout * 1000) {
      const status = await this.getStatus(instanceId);
      if (status === "active" || status === "running") return true;
      await new Promise((r) => setTimeout(r, 5000));
    }
    throw new Error(`VPS not ready within ${timeout} seconds`);
  }

  // Template method for binary deployment
  async deployBinary(instanceId, binaryPath, serviceName, transport) {
    const host = await this.getHost(instanceId);
    const remotePath = `/opt/${serviceName}`;

    // 1. Transfer binary
    await transport.transfer(binaryPath, remotePath, host);

    // 2. Make executable
    await transport.execute(`chmod +x ${remotePath}`, host);

    // 3. Create systemd service
    const serviceContent = this.createSystemdService(remotePath, serviceName);
    await transport.writeFile(
      `/etc/systemd/system/${serviceName}.service`,
      serviceContent,
      host
    );

    // 4. Enable and start service
    await transport.execute(`systemctl daemon-reload`, host);
    await transport.execute(`systemctl enable ${serviceName}`, host);
    await transport.execute(`systemctl start ${serviceName}`, host);

    // 5. Verify service started
    await transport.execute(`systemctl is-active ${serviceName}`, host);
  }

  createSystemdService(binaryPath, serviceName) {
    return `[Unit]
Description=${serviceName}
After=network.target

[Service]
Type=simple
ExecStart=${binaryPath}
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
`;
  }
}
```

### Base Serverless Operations

```javascript
// src/providers/base/serverless.js
export class BaseServerless {
  constructor(provider) {
    this.provider = provider;
  }

  // Abstract methods
  async deploy(functionName, code, config) {
    throw new Error("deploy() must be implemented");
  }
  async update(functionName, code) {
    throw new Error("update() must be implemented");
  }
  async delete(functionName) {
    throw new Error("delete() must be implemented");
  }
  async invoke(functionName, payload) {
    throw new Error("invoke() must be implemented");
  }
  async findByName(resourceName) {
    throw new Error("findByName() must be implemented");
  }

  // Common serverless patterns
  async deployWithHealthCheck(
    functionName,
    code,
    config,
    healthPath = "/health"
  ) {
    await this.deploy(functionName, code, config);
    await this.waitForReady(functionName);

    // Verify health endpoint
    try {
      const response = await this.invoke(functionName, { path: healthPath });
      if (response.statusCode !== 200) {
        throw new Error(`Health check failed: ${response.statusCode}`);
      }
      return response;
    } catch (err) {
      throw new Error(`Health check failed: ${err.message}`);
    }
  }

  async waitForReady(functionName, timeout = 60) {
    const start = Date.now();
    while (Date.now() - start < timeout * 1000) {
      try {
        const status = await this.getStatus(functionName);
        if (status === "active" || status === "ready") return true;
      } catch (err) {
        // Function might not exist yet, continue polling
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error(`Function not ready within ${timeout} seconds`);
  }
}
```

### Base Static Host Operations

```javascript
// src/providers/base/static-host.js
export class BaseStaticHost {
  constructor(provider) {
    this.provider = provider;
  }

  // Abstract methods
  async upload(files) {
    throw new Error("upload() must be implemented");
  }
  async delete(paths) {
    throw new Error("delete() must be implemented");
  }
  async list() {
    throw new Error("list() must be implemented");
  }
  async findByName(resourceName) {
    throw new Error("findByName() must be implemented");
  }

  // Common static deployment workflow
  async deployDirectory(localPath, remotePath = "/") {
    // 1. Scan local directory recursively
    const localFiles = await this.scanDirectory(localPath);

    // 2. Get current remote files
    const remoteFiles = await this.list();

    // 3. Calculate changes needed
    const toUpload = [];
    const toDelete = [];

    for (const localFile of localFiles) {
      const remoteFile = remoteFiles.find(
        (f) => f.path === localFile.relativePath
      );
      if (!remoteFile || remoteFile.hash !== localFile.hash) {
        toUpload.push(localFile);
      }
    }

    for (const remoteFile of remoteFiles) {
      const localFile = localFiles.find(
        (f) => f.relativePath === remoteFile.path
      );
      if (!localFile) {
        toDelete.push(remoteFile.path);
      }
    }

    // 4. Execute changes
    if (toDelete.length > 0) {
      await this.delete(toDelete);
    }

    if (toUpload.length > 0) {
      await this.upload(toUpload);
    }

    return {
      uploaded: toUpload.length,
      deleted: toDelete.length,
      unchanged: localFiles.length - toUpload.length,
    };
  }

  async scanDirectory(dirPath) {
    const files = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await this.scanDirectory(fullPath);
        files.push(...subFiles);
      } else {
        const content = await fs.readFile(fullPath);
        const hash = crypto.createHash("sha256").update(content).digest("hex");
        files.push({
          absolutePath: fullPath,
          relativePath: path.relative(dirPath, fullPath),
          content,
          hash,
          size: content.length,
          mimeType: this.getMimeType(entry.name),
        });
      }
    }

    return files;
  }
}
```

## Transport Layer

### SSH Transport

```javascript
// src/transports/ssh.js
export class SSHTransport {
  constructor(keyPath, user = "root") {
    this.keyPath = keyPath;
    this.user = user;
  }

  async execute(command, host) {
    return new Promise((resolve, reject) => {
      const ssh = spawn("ssh", [
        "-i",
        this.keyPath,
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "UserKnownHostsFile=/dev/null",
        "-o",
        "ConnectTimeout=10",
        `${this.user}@${host}`,
        command,
      ]);

      let stdout = "";
      let stderr = "";

      ssh.stdout.on("data", (data) => (stdout += data));
      ssh.stderr.on("data", (data) => (stderr += data));

      ssh.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        } else {
          reject(
            new Error(`SSH command failed (exit ${code}): ${stderr || stdout}`)
          );
        }
      });

      ssh.on("error", reject);
    });
  }

  async writeFile(content, remotePath, host) {
    const tempFile = `/tmp/soar-${Date.now()}`;
    await fs.writeFile(tempFile, content);

    try {
      await this.transfer(tempFile, remotePath, host);
    } finally {
      await fs.unlink(tempFile).catch(() => {}); // Cleanup temp file
    }
  }
}
```

### SCP Transport

```javascript
// src/transports/scp.js
export class SCPTransport {
  constructor(keyPath, user = "root") {
    this.keyPath = keyPath;
    this.user = user;
  }

  async transfer(localPath, remotePath, host) {
    return new Promise((resolve, reject) => {
      const scp = spawn("scp", [
        "-i",
        this.keyPath,
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "UserKnownHostsFile=/dev/null",
        "-o",
        "ConnectTimeout=10",
        localPath,
        `${this.user}@${host}:${remotePath}`,
      ]);

      let stderr = "";
      scp.stderr.on("data", (data) => (stderr += data));

      scp.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`SCP transfer failed (exit ${code}): ${stderr}`));
        }
      });

      scp.on("error", reject);
    });
  }
}
```

## Deployment Planning (Dry-Run)

### Planning Architecture

```javascript
// src/orchestration/planner.js
export class DeploymentPlanner {
  async plan(config) {
    // 1. Validate configuration
    await this.validateConfig(config);

    // 2. Validate resource name universally
    ResourceIdentity.validate(config.resource.name);

    // 3. Check existing resources
    const existing = await this.findExistingResource(config);

    // 4. Calculate changes needed
    const changes = await this.calculateChanges(config, existing);

    // 5. Estimate costs
    const costEstimate = await this.estimateCosts(config, changes);

    return {
      resourceName: config.resource.name,
      provider: config.target.provider,
      target: config.target.type,
      changes,
      costEstimate,
      summary: {
        toCreate: changes.filter((c) => c.action === "CREATE").length,
        toUpdate: changes.filter((c) => c.action === "UPDATE").length,
        toDestroy: changes.filter((c) => c.action === "DESTROY").length,
      },
    };
  }

  async calculateChanges(config, existing) {
    const changes = [];

    if (!existing) {
      // New deployment
      changes.push({
        action: "CREATE",
        resource: this.getResourceType(config.target.type),
        name: config.resource.name,
        provider: config.target.provider,
        details: config.target.config,
      });

      if (config.target.type === "droplet") {
        changes.push({
          action: "CREATE",
          resource: "SSH Key",
          name: `${config.resource.name}-key`,
          provider: config.target.provider,
        });

        changes.push({
          action: "CREATE",
          resource: "Firewall Rule",
          name: `${config.resource.name}-fw`,
          provider: config.target.provider,
          details: {
            ports: [22, 80, 443],
            sources: ["0.0.0.0/0"],
          },
        });
      }
    } else {
      // Update existing deployment
      const currentHash = existing.metadata?.artifactHash;
      const newHash = await this.calculateArtifactHash(config.artifact.path);

      if (currentHash !== newHash) {
        changes.push({
          action: "UPDATE",
          resource: "Deployment",
          name: config.resource.name,
          details: {
            currentVersion: currentHash?.substring(0, 8) || "unknown",
            newVersion: newHash.substring(0, 8),
            artifactSize: await this.getArtifactSize(config.artifact.path),
          },
        });
      } else {
        changes.push({
          action: "NO_CHANGE",
          resource: "Deployment",
          name: config.resource.name,
          details: { reason: "Artifact unchanged" },
        });
      }
    }

    return changes;
  }
}
```

### Dry-Run Output Format

```
Soar Deployment Plan for: my-app-prod

Configuration:
  Provider: digitalocean
  Target: droplet (nyc3, s-1vcpu-2gb, ubuntu-22-04-x64)
  Artifact: binary (47.1MB)
  Transport: ssh

Planned changes:

  + CREATE digitalocean_droplet.my-app-prod
      region: nyc3
      size: s-1vcpu-2gb
      image: ubuntu-22-04-x64
      estimated_cost: $6.00/month

  + CREATE digitalocean_ssh_key.my-app-prod-key
      public_key: ssh-rsa AAAAB3N... (from ~/.ssh/id_rsa.pub)

  + CREATE digitalocean_firewall.my-app-prod-fw
      inbound_rules: [22/tcp, 80/tcp, 443/tcp]
      sources: ["0.0.0.0/0"]

  + CREATE binary_deployment.my-app-prod
      artifact_hash: def456ab
      artifact_size: 47.1MB
      service_name: my-app-prod
      health_check: /health

Plan: 4 to create, 0 to update, 0 to destroy.
Estimated monthly cost: $6.00

To apply this plan, run: soar deploy soar.config.js
```

## CLI Interface

### Command Structure

```bash
# Planning commands (dry-run)
soar plan [config.js] [options]
soar plan soar.config.js                    # Plan deployment
soar plan soar.config.js:production         # Plan named export
soar plan --verbose                          # Detailed output
soar plan --destroy                          # Plan destruction

# Deployment commands
soar deploy [config.js] [options]
soar deploy soar.config.js                  # Deploy from config
soar deploy soar.config.js:production       # Deploy named export
soar deploy --auto-approve                  # Skip confirmation
soar deploy --verbose                       # Detailed output

# Resource management
soar list                                   # List managed resources
soar show <resource-name>                   # Show resource details
soar destroy <resource-name>                # Destroy specific resource

# Utility commands
soar validate soar.config.js               # Validate config only
soar version                                # Show version
soar help                                   # Show help
```

### Configuration Input Methods

Following Fledge's precedence:

```bash
# 1. Piped input (highest priority)
echo "export default {resource: {name: 'test'}}" | soar plan

# 2. Configuration file (second priority)
soar plan soar.config.js

# 3. Named export (third priority)
soar plan soar.config.js:production

# 4. CLI flags (lowest priority)
soar plan --resource-name test --provider digitalocean --type droplet
```

## State Management

### Resource State Tracking

```javascript
// src/state/resource-state.js
export class ResourceState {
  static async save(resourceName, provider, metadata) {
    const state = {
      managedBy: "soar",
      resourceName,
      deployedAt: new Date().toISOString(),
      artifactHash: metadata.artifactHash,
      configHash: metadata.configHash,
      soarVersion: metadata.soarVersion,
    };

    // Store in provider-specific tags/labels
    await provider.tagResource(resourceName, state);
  }

  static async load(resourceName, provider) {
    const tags = await provider.getResourceTags(resourceName);
    return tags?.managedBy === "soar" ? tags : null;
  }

  static async listManaged(provider) {
    const resources = await provider.listResources();
    return resources.filter((r) => r.tags?.managedBy === "soar");
  }
}
```

## Concrete Provider Implementations

### DigitalOcean Provider

```javascript
// src/providers/digitalocean/api.js
export class DigitalOceanProvider extends BaseProvider {
  constructor(credentials) {
    super(credentials);
    this.baseURL = "https://api.digitalocean.com/v2";
    this.headers = {
      Authorization: `Bearer ${credentials.token}`,
      "Content-Type": "application/json",
    };
  }

  async authenticate() {
    try {
      await this.request("GET", "/account");
      return true;
    } catch (err) {
      throw new Error(`DigitalOcean authentication failed: ${err.message}`);
    }
  }

  async tagResource(resourceId, tags) {
    const tagNames = Object.entries(tags).map(([key, value]) =>
      `${key}:${value}`.replace(/[^a-zA-Z0-9:_-]/g, "_")
    );

    return await this.request("POST", `/droplets/${resourceId}/actions`, {
      type: "tag",
      tags: tagNames,
    });
  }
}

// src/providers/digitalocean/droplets.js
export class DigitalOceanVPS extends BaseVPS {
  async create(config) {
    const dropletConfig = {
      name: config.resource.name,
      region: config.target.config.region,
      size: config.target.config.size,
      image: config.target.config.image,
      ssh_keys: [], // Will be populated with uploaded key
      tags: [
        "managed-by-soar",
        `resource-${config.resource.name}`,
        `created-${new Date().toISOString().split("T")[0]}`,
      ],
    };

    return await this.provider.request("POST", "/droplets", dropletConfig);
  }

  async findByName(resourceName) {
    const response = await this.provider.request("GET", "/droplets");
    return response.droplets.find((d) => d.name === resourceName);
  }

  async getStatus(instanceId) {
    const response = await this.provider.request(
      "GET",
      `/droplets/${instanceId}`
    );
    return response.droplet.status; // 'new' | 'active' | 'off'
  }

  async getHost(instanceId) {
    const response = await this.provider.request(
      "GET",
      `/droplets/${instanceId}`
    );
    const networks = response.droplet.networks.v4;
    const publicNetwork = networks.find((n) => n.type === "public");
    return publicNetwork?.ip_address;
  }
}
```

### Cloudflare Provider

```javascript
// src/providers/cloudflare/api.js
export class CloudflareProvider extends BaseProvider {
  constructor(credentials) {
    super(credentials);
    this.baseURL = "https://api.cloudflare.com/client/v4";
    this.headers = {
      Authorization: `Bearer ${credentials.token}`,
      "Content-Type": "application/json",
    };
    this.accountId = credentials.accountId;
    this.zoneId = credentials.zoneId;
  }

  async authenticate() {
    try {
      const response = await this.request("GET", "/user/tokens/verify");
      return response.success;
    } catch (err) {
      throw new Error(`Cloudflare authentication failed: ${err.message}`);
    }
  }
}

// src/providers/cloudflare/workers.js
export class CloudflareServerless extends BaseServerless {
  async deploy(functionName, code, config) {
    const scriptName = config.resource.name;

    // Upload script
    const response = await this.provider.request(
      "PUT",
      `/accounts/${this.provider.accountId}/workers/scripts/${scriptName}`,
      {
        body: code,
        metadata: {
          bindings: [],
          main_module: `${scriptName}.js`,
          compatibility_date: "2023-05-18",
        },
      }
    );

    return response;
  }

  async findByName(resourceName) {
    const response = await this.provider.request(
      "GET",
      `/accounts/${this.provider.accountId}/workers/scripts`
    );
    return response.result.find((s) => s.id === resourceName);
  }
}

// src/providers/cloudflare/pages.js
export class CloudflareStaticHost extends BaseStaticHost {
  async upload(files) {
    // CF Pages uses different upload mechanism
    // Create deployment via direct upload API
    const formData = new FormData();

    for (const file of files) {
      formData.append(
        file.relativePath,
        new Blob([file.content]),
        file.relativePath
      );
    }

    return await this.provider.request(
      "POST",
      `/accounts/${this.provider.accountId}/pages/projects/${this.projectName}/deployments`,
      formData
    );
  }
}
```

## Deployment Orchestration

### Main Orchestrator

```javascript
// src/orchestration/deployment.js
export class DeploymentOrchestrator {
  async deploy(config, options = {}) {
    const { dryRun = false, autoApprove = false, verbose = false } = options;

    // 1. Validate configuration
    await this.validateConfig(config);

    // 2. Plan deployment
    const plan = await this.planner.plan(config);

    if (verbose) {
      console.log("Deployment Plan:");
      this.printPlan(plan);
    }

    if (dryRun) {
      return plan;
    }

    // 3. Confirm with user (unless auto-approved)
    if (!autoApprove) {
      const confirmed = await this.confirmDeployment(plan);
      if (!confirmed) {
        throw new Error("Deployment cancelled by user");
      }
    }

    // 4. Execute deployment
    const result = await this.executeDeployment(config, plan);

    // 5. Save state
    await this.saveDeploymentState(config, result);

    return result;
  }

  async executeDeployment(config, plan) {
    const provider = this.createProvider(config);
    const startTime = Date.now();

    try {
      switch (config.target.type) {
        case "droplet":
          return await this.deployToVPS(provider, config, plan);
        case "functions":
          return await this.deployToServerless(provider, config, plan);
        case "workers":
          return await this.deployToServerless(provider, config, plan);
        case "pages":
          return await this.deployToStaticHost(provider, config, plan);
        default:
          throw new Error(`Unknown target type: ${config.target.type}`);
      }
    } catch (err) {
      // Log deployment failure
      console.error(
        `Deployment failed after ${Date.now() - startTime}ms: ${err.message}`
      );
      throw err;
    }
  }

  async deployToVPS(provider, config, plan) {
    const vps = this.createVPS(provider, config);
    const transport = this.createTransport(config);

    // Check if resource exists
    let instance = await vps.findByName(config.resource.name);

    if (!instance) {
      // Create new VPS
      console.log(`Creating VPS: ${config.resource.name}`);
      instance = await vps.create(config);

      console.log(`Waiting for VPS to be ready...`);
      await vps.waitForReady(instance.id);
    }

    // Deploy binary
    console.log(`Deploying binary to VPS...`);
    await vps.deployBinary(
      instance.id,
      config.artifact.path,
      config.deployment.serviceName || config.resource.name,
      transport
    );

    // Health check
    if (config.deployment.healthCheck) {
      console.log(`Performing health check...`);
      await this.performHealthCheck(instance, config.deployment.healthCheck);
    }

    return {
      resourceId: instance.id,
      resourceName: config.resource.name,
      host: await vps.getHost(instance.id),
      deployedAt: new Date().toISOString(),
    };
  }
}
```

## Implementation Priority

### Phase 1: Core Foundation

1. **Base classes** - Provider, VPS, Serverless, StaticHost
2. **Config system** - SoarConfig, import utilities, validation
3. **Resource identity** - Universal naming, validation
4. **CLI framework** - Basic commands, argument parsing

### Phase 2: DigitalOcean VPS

1. **DigitalOcean provider** - API client, authentication
2. **VPS operations** - Create, destroy, list, status
3. **SSH/SCP transports** - File transfer, command execution
4. **Binary deployment** - Systemd service creation, health checks

### Phase 3: Planning & State

1. **Deployment planner** - Dry-run capabilities, change detection
2. **State management** - Resource tracking, metadata storage
3. **CLI plan command** - Terraform-like planning output

### Phase 4: Serverless Support

1. **Cloudflare Workers** - Script deployment, routing
2. **DigitalOcean Functions** - Function deployment, invocation
3. **Script artifact handling** - Bundle validation, upload

### Phase 5: Static Hosting

1. **Cloudflare Pages** - Static file upload, build triggers
2. **Static artifact handling** - Directory scanning, file diff
3. **CDN integration** - Cache invalidation, domain setup

### Phase 6: Advanced Features

1. **Rollback capabilities** - Previous version restoration
2. **Multi-region deployment** - Geographic distribution
3. **Advanced health checks** - Custom validation logic
4. **Cost optimization** - Resource sizing recommendations

## Success Criteria

### Deployment Reliability

- **Zero-downtime deployments** for existing resources
- **Automatic rollback** on deployment failure
- **Health check validation** before marking deployment complete
- **State consistency** across all operations

### Developer Experience

- **Terraform-like planning** with clear change preview
- **Universal resource naming** across all providers
- **Clear error messages** with actionable guidance
- **Verbose logging** for debugging deployments

### Security & Compliance

- **Environment variable secrets** - no hardcoded credentials
- **SSH key management** - secure key handling
- **API token validation** - authentication verification
- **Resource tagging** - clear ownership and management

### Performance & Efficiency

- **Parallel operations** where possible
- **Minimal API calls** - batch operations when available
- **Efficient file transfers** - only upload changed files
- **Fast dry-runs** - quick planning without resource creation

---

**The murder's final wisdom:** Soar eliminates deployment chaos through surgical precision. Every resource has an identity, every change has a plan, every deployment has verification. Ravens don't guess - they scout, plan, and strike with overwhelming intelligence.

This document serves as the **single source of truth** for Soar implementation. Follow the CODEX, trust the base classes, validate everything, and deploy with the confidence of apex predators.
