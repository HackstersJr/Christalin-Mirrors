# Deployment & Domain Transition Guide: sunprosportsacademy.com

This document provides step-by-step instructions to configure your Virtual Machine (VM) and Cloudflare for the new official domain.

---

## Phase 3: Domain & SSL (Cloudflare Setup)

To ensure a professional "Green Lock" and high performance, we use Cloudflare for DNS and SSL.

### 1. Cloudflare Configuration
1.  **Add Site**: Enter `sunprosportsacademy.com` in your Cloudflare Dashboard.
2.  **DNS Verification**:
    - **Type A**: `@` -> `134.209.155.190` (Ensure Proxy is **ON/Orange**).
    - **Type CNAME**: `www` -> `sunprosportsacademy.com` (Ensure Proxy is **ON/Orange**).
3.  **SSL/TLS Settings**:
    - Navigate to **SSL/TLS > Overview**.
    - Set Encryption Mode to **Full**.
    - This ensures the connection between Cloudflare and your VM is secure.

### 2. Hostinger Nameserver Migration
1.  Log in to **Hostinger** > **Domains**.
2.  Find **Nameservers** and click **Change**.
3.  Replace the default Hostinger nameservers with the ones provided by Cloudflare:
    - *Example*: `nina.ns.cloudflare.com`
    - *Example*: `oliver.ns.cloudflare.com`
4.  **Wait for Propagation**: This can take anywhere from 15 minutes to 24 hours (usually fast).

### 3. Verification
Once the nameservers update, visit [https://sunprosportsacademy.com](https://sunprosportsacademy.com).
- Click the **Padlock icon** in the browser to verify the Cloudflare certificate.
- Your site is now protected by Cloudflare's WAF and CDN.

### A. DNS Settings
1. Log in to your Cloudflare Dashboard.
2. Go to **DNS** > **Records**.
3. Create/Update the following records:
   - **Type**: `A` | **Name**: `@` | **Content**: `[YOUR_VM_PUBLIC_IP]` | **Proxy**: `Enabled` (Orange cloud)
   - **Type**: `CNAME` | **Name**: `www` | **Content**: `sunprosportsacademy.com` | **Proxy**: `Enabled`

### B. SSL/TLS Settings
1. Go to **SSL/TLS** > **Overview**.
2. Set the encryption mode to **Full (Strict)**.
3. Go to **SSL/TLS** > **Edge Certificates**.
4. Enable **Always Use HTTPS**.

---

## 2. VM (Nginx) Configuration

Your VM needs to know that it is serving `sunprosportsacademy.com`.

### A. Update Server Block
Connect to your VM via SSH and edit your Nginx configuration (usually in `/etc/nginx/sites-available/default` or similar):

```nginx
server {
    listen 80;
    server_name sunprosportsacademy.com www.sunprosportsacademy.com;

    root /var/www/sunpro/dist; # Path to your build folder
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### B. Test and Reload
Run these commands to apply the changes:
```bash
sudo nginx -t           # Test the config for syntax errors
sudo systemctl reload nginx
```

---

## 3. SSL with Let's Encrypt (Certbot)

Even with Cloudflare, it's best practice to have SSL on your origin server.

1. Install Certbot:
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```
2. Generate the Certificate:
   ```bash
   sudo certbot --nginx -d sunprosportsacademy.com -d www.sunprosportsacademy.com
   ```
3. Follow the prompts to automatically update your Nginx config.

---

## 4. Verification Check
After the DNS propagates (usually 5-15 minutes), verify your setup by running:

```bash
curl -I https://sunprosportsacademy.com
```
You should see a `HTTP/2 200` response from Cloudflare.
