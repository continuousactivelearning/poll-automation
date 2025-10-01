# Frontend-Backend Connection Guide

## Overview
The frontend and backend are now properly connected with the following configuration:

### Backend (Port 3000)
- **URL**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3000`
- **Main endpoints**:
  - `/api/poll` - Poll configuration
  - `/settings` - Host settings
  - `/questions` - Save questions
  - `/transcripts` - Transcript management
  - `/` - Health check

### Frontend (Port 5174)
- **URL**: `http://localhost:5174`
- **API Configuration**: Centralized in `src/utils/api.ts`
- **Proxy**: Configured in `vite.config.ts` to forward API calls to backend

## How to Start Both Services

### Option 1: Using Turbo (Recommended)
```bash
# From the root directory
pnpm dev
```

This will start both frontend and backend simultaneously.

### Option 2: Manual Start
```bash
# Terminal 1 - Start Backend
cd apps/backend
pnpm dev

# Terminal 2 - Start Frontend  
cd apps/frontend
pnpm dev
```

## API Configuration

### Centralized API Service
The frontend uses a centralized API configuration in `apps/frontend/src/utils/api.ts`:

- **Base URL**: `http://localhost:3000`
- **Timeout**: 10 seconds
- **Interceptors**: Automatic token handling and error management
- **Endpoints**: All API endpoints are defined in `API_ENDPOINTS`

### Key Features
1. **Automatic Authentication**: Adds Bearer token to requests if available
2. **Error Handling**: Automatically redirects to login on 401 errors
3. **Type Safety**: TypeScript interfaces for API responses
4. **Consistent Error Handling**: Centralized error management

## Updated Components

The following components have been updated to use the new API configuration:

1. **HostSettings.tsx** - Uses `apiService.updateSettings()`
2. **TranscriptListener.tsx** - Uses `apiService.getTranscripts()`
3. **UploadWAV.tsx** - Uses `apiService.updateRealtimeTranscripts()`

## WebSocket Connection

WebSocket connections are configured to connect to `ws://localhost:3000` and are used for:
- Real-time transcript updates
- Live communication between frontend and backend

## Environment Variables

For production, you can set the following environment variables:
- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL

Currently, these are hardcoded to localhost for development.

## Testing the Connection

1. Start both services using `pnpm dev`
2. Open `http://localhost:5174` in your browser
3. Navigate to the Host Settings page
4. Try saving settings - this will test the API connection
5. Check the browser's Network tab to see API calls

## Troubleshooting

### Common Issues

1. **CORS Errors**: Backend has CORS enabled for all origins in development
2. **Port Conflicts**: Ensure ports 3000 and 5174 are available
3. **WebSocket Connection**: Check that WebSocket server is running on backend
4. **API Timeouts**: Increase timeout in `api.ts` if needed

### Debug Steps

1. Check backend logs for incoming requests
2. Check browser console for API errors
3. Verify both services are running on correct ports
4. Test API endpoints directly using tools like Postman 