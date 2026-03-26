# ShareFiles - Modern File Sharing Web App

A production-ready, single-page file sharing application built with Next.js 15, TypeScript, and Tailwind CSS. Upload files anonymously, generate a unique code, and share with others. Files automatically expire and delete.

## Features

✨ **Key Features:**
- 🔼 Anonymous file upload with drag & drop
- 📤 Upload progress tracking with visual progress bar
- 🎯 Generate unique 6-character codes for sharing
- 📱 QR code generation for easy mobile sharing
- ⏰ Configurable expiry times (15m, 1h, 24h)
- 🔗 Copy-to-clipboard functionality
- 🌓 Dark/light mode with localStorage persistence
- 📦 Cloudflare R2 integration for file storage
- 🗄️ Supabase for metadata storage
- 🚀 Auto-delete expired files (cron-ready)
- 📥 Download files by entering code
- 📊 File size validation (max 100MB)
- ✅ File type validation
- 🎨 Clean, minimal UI
- 📱 Fully responsive (mobile, tablet, desktop)

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS (dark mode support)
- **Icons:** Lucide React
- **Forms:** React Dropzone, Axios
- **QR Codes:** qrcode.react
- **State:** Zustand (for optional future enhancements)
- **Validation:** Zod
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Cloudflare R2 (S3-compatible)
- **Type Checking:** TypeScript 5.3
- **Linting:** ESLint

## Project Structure

```
share-files/
├── app/
│   ├── api/
│   │   ├── upload/route.ts          # File upload handler
│   │   ├── get-file/route.ts        # File retrieval by code
│   │   └── delete-expired/route.ts  # Cleanup endpoint
│   ├── components/
│   │   ├── Header.tsx               # App header with theme toggle
│   │   ├── ThemeToggle.tsx          # Dark/light mode toggle
│   │   ├── UploadBox.tsx            # Drag-drop file upload
│   │   ├── ExpirySelector.tsx       # Expiry time selector
│   │   ├── ProgressBar.tsx          # Upload progress display
│   │   ├── ResultCard.tsx           # Success state with code
│   │   ├── QRCodeDisplay.tsx        # QR code generation
│   │   ├── DownloadForm.tsx         # Download by code form
│   │   ├── HowItWorks.tsx           # 3-step guide
│   │   └── Footer.tsx               # Footer with branding
│   ├── lib/
│   │   ├── types.ts                 # TypeScript type definitions
│   │   ├── constants.ts             # App constants
│   │   ├── codeGenerator.ts         # Code generation logic
│   │   ├── validation.ts            # Zod validation schemas
│   │   ├── supabaseClient.ts        # Supabase client setup
│   │   ├── r2Client.ts              # Cloudflare R2 client
│   │   └── utils.ts                 # Utility functions
│   ├── styles/
│   │   └── globals.css              # Global Tailwind styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Main page (single-page app)
├── public/                          # Static assets
├── .env.local                       # Environment variables (template)
├── .eslintrc.json                  # ESLint configuration
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── next.config.js                  # Next.js configuration
├── postcss.config.js               # PostCSS configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

## Setup & Installation

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase account (free tier available)
- Cloudflare R2 account (free 10GB/month)

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is needed due to qrcode.react's React version constraints.

### 2. Environment Configuration

Copy the `.env.local` template and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=share-files
R2_REGION=auto

# Cleanup API Secret (for cron jobs)
CLEANUP_API_SECRET=your-cleanup-secret
```

### 3. Supabase Setup

1. Create a [Supabase project](https://app.supabase.com)
2. Run the SQL schema to create the `files` table:

```sql
-- Create files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  file_url TEXT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  downloaded_count INT DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX idx_code ON files(code);
CREATE INDEX idx_expires_at ON files(expires_at);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access
CREATE POLICY "Allow anonymous access" ON files
  FOR SELECT USING (true);
```

3. Get your API credentials from Supabase Dashboard:
   - `Settings → API` → `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Settings → API` → `Service Role Secret Key` → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Cloudflare R2 Setup

1. Create a [Cloudflare account](https://dash.cloudflare.com)
2. Go to `R2` → `Create bucket` → name it `share-files`
3. Create API token:
   - `Account Home → R2 → Settings`
   - `Create API token` with read/write permissions
4. Get credentials:
   - `R2_ACCOUNT_ID`: Your Cloudflare Account ID
   - `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`: From the API token
   - `R2_BUCKET_NAME`: `share-files` (or your bucket name)

### 5. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build

```bash
npm run build
npm start
```

## API Routes

### POST /api/upload
Upload a file and get a unique code.

**Request:**
```
Content-Type: multipart/form-data

file: <File object>
expiryMinutes: "15" | "60" | "1440"
```

**Response (201):**
```json
{
  "code": "ABCDEF",
  "expiresAt": "2025-03-26T06:30:00Z",
  "expiresIn": 60,
  "fileSize": 1048576,
  "filename": "document.pdf"
}
```

**Error (400/413/500):**
```json
{
  "code": "FILE_TOO_LARGE" | "INVALID_FILE_TYPE" | "UPLOAD_FAILED" | "NO_FILE",
  "message": "Human-readable error message"
}
```

### GET /api/get-file?code=ABCDEF
Retrieve file metadata and download URL.

**Response (200):**
```json
{
  "fileUrl": "https://...",
  "filename": "document.pdf",
  "fileSize": 1048576,
  "expiresAt": "2025-03-26T06:30:00Z",
  "expiresIn": 45
}
```

**Error (404/410):**
```json
{
  "code": "INVALID_CODE" | "EXPIRED",
  "message": "File not found or has expired"
}
```

### POST /api/delete-expired
Clean up expired files (requires Bearer token).

**Request:**
```
Authorization: Bearer <CLEANUP_API_SECRET>
```

**Response (200):**
```json
{
  "message": "Cleanup completed. Deleted 5 files.",
  "deleted_count": 5,
  "status": "success"
}
```

## Cleanup & Cron Jobs

Files are automatically scheduled for deletion when they expire. To set up automatic cleanup:

### Using Vercel Cron

This repo includes `vercel.json` with a cron job that calls `/api/delete-expired` every 15 minutes.

Set both environment variables in your Vercel project:

```env
CLEANUP_API_SECRET=your-strong-secret
CRON_SECRET=your-strong-secret
```

`CRON_SECRET` is used by Vercel when invoking cron routes, and your API route verifies the Bearer token against `CLEANUP_API_SECRET`.

### Using Cloudflare Workers (Recommended)

Create a scheduled Cloudflare Worker:

```javascript
export default {
  async scheduled(event, env, ctx) {
    const secret = env.CLEANUP_API_SECRET;
    const url = 'https://your-domain.com/api/delete-expired';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
      },
    });
    
    const result = await response.json();
    console.log('Cleanup result:', result);
  },
};
```

Schedule it to run every 5 minutes or hourly.

### Using External Cron Service

Services like [EasyCron](https://www.easycron.com/) can trigger:
```
POST https://your-domain.com/api/delete-expired
Header: Authorization: Bearer YOUR_CLEANUP_API_SECRET
```

## Code Generation

Codes are 6 characters using safe alphanumeric characters:
- **Includes:** `A-Z, 2-9`
- **Excludes:** `I, L, O, 0, 1` (confusing characters)
- **Format:** `ABCDEF` (uppercase, no special chars)

## File Type Support

Supported MIME types include:
- **Documents:** PDF, Word, Excel, PowerPoint, Plain text, CSV
- **Archives:** ZIP, RAR, 7Z, GZIP
- **Images:** JPEG, PNG, GIF, WebP, SVG
- **Audio:** MP3, WAV, MP4, WebM
- **Video:** MP4, WebM, MOV, AVI

Max file size: **100MB**

## Dark Mode

Dark mode preference is automatically detected from system settings and can be toggled via the theme button in the header. Preference is persisted in localStorage.

## Performance Optimizations

- ✅ Static pre-rendering of main page
- ✅ API route compression
- ✅ Image optimization with Next.js Image component
- ✅ CSS optimization via Tailwind
- ✅ Bundle size optimization (132KB First Load JS)
- ✅ Database indexes on frequently queried fields

## Error Handling

- File size validation (client + server)
- File type validation
- Expiry time validation
- Unique code generation with collision prevention
- Graceful error messages for users
- Comprehensive logging for debugging

## Future Enhancements

- [ ] Password protection for downloads
- [ ] Download tracking and analytics
- [ ] Custom expiry duration input
- [ ] Email notifications
- [ ] Download link encryption
- [ ] Rate limiting by IP
- [ ] Bandwidth usage tracking
- [ ] Custom domain CNAME support
- [ ] File preview before download
- [ ] Batch file uploads

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

- **Anonymous:** No user accounts or tracking
- **Encrypted:** Files transmitted over HTTPS
- **Auto-delete:** Automatic expiration and deletion
- **No logging:** No download logs or IP logging
- **No ads:** Clean, ad-free interface
- **Open source:** Full code transparency

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy with one click

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual/VPS

```bash
npm install --legacy-peer-deps
npm run build
npm start
```

## Troubleshooting

### Build fails with peer dependency errors
Use `npm install --legacy-peer-deps`

### Supabase connection errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Check service role key has admin access
- Ensure `files` table exists with correct schema

### R2 upload fails
- Verify `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- Check bucket name matches `R2_BUCKET_NAME`
- Ensure API token has read/write permissions

### QR code not rendering
- Ensure `qrcode.react` and types are installed
- Clear `.next` folder and rebuild

### Dark mode not persisting
- Check browser localStorage permissions
- Clear cookies/cache and reload

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Submit a pull request

## License

MIT License - See LICENSE.md for details

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**

Happy file sharing! 🎉
