# Dispatch Application - AI Coding Instructions

## Architecture Overview

This is a **transportation dispatch system** with three interconnected projects:

| Project              | Tech Stack                          | Purpose                  |
| -------------------- | ----------------------------------- | ------------------------ |
| `DispatchApp.Server` | ASP.NET Core + EF Core + SQL Server | REST API + SignalR hub   |
| `DispatchApp.client` | React 19 + Vite + MUI               | Dispatcher web dashboard |
| `DriverApp`          | React Native + Expo                 | Mobile app for drivers   |

**Data Flow**: Both client apps communicate with the server via REST APIs (`/api/*`) and real-time SignalR WebSockets (`/hubs/dispatch`).

## Key Integration Patterns

### SignalR Real-Time Communication

- **Hub**: `Hubs/Dispatch.cs` - handles all real-time messaging between dispatchers and drivers
- **Client services**: `src/services/signalRService.js` in both apps (different implementations)
- **Events**: `NewCallAvailable`, `CallAssigned`, `CallUnassigned`, `DriverLocationUpdated`, etc.
- **Heartbeat system**: Drivers send periodic heartbeats; inactive after 15 min timeout

### API Endpoint Convention

- All endpoints defined in `src/config/apiConfig.js` → `config.ENDPOINTS.*`
- Server controllers: `Controllers/{Ride|User|Communication}Controller.cs`
- Pattern: `POST /api/Ride/{Action}` with `[FromBody]` parameters

### Authentication Flow

- Login via `/api/user/login` with `userType` = `'dispatcher'` or `'driver'`
- JWT tokens stored: `localStorage` (web) or `AsyncStorage` (mobile)
- Auth state managed in `contexts/AuthContext.jsx` (each app has its own)

## Project-Specific Conventions

### Server (C#)

- **Repository pattern**: `Data/DataRepositories/*Repo.cs` - pass connection string to constructor
- **Data types**: `Data/DataTypes/*.cs` - match frontend models exactly
- **DbContext**: Manual connection string via `new DispatchDbContext(_connectionString)`
- **Migrations**: EF Core with SQL Server; connection string in `appsettings.json` → `ConStr`

### Dispatcher Client (React/Vite)

- **UI Framework**: Material-UI v7 (`@mui/material`)
- **Routing**: React Router v7 with nested routes under `/dashboard/*`
- **State**: React Context (`AuthContext`) + local component state
- **Maps**: Google Maps via `@react-google-maps/api` with `GoogleMapsProvider` wrapper

### Driver App (React Native/Expo)

- **Navigation**: Manual tab-based in `HomeScreen.jsx` (no navigation library)
- **Storage**: `AsyncStorage` for persistence (NOT localStorage)
- **Location**: `expo-location` for GPS tracking sent via SignalR
- **Theme**: Custom `ThemeContext` with dark mode support

## Critical Files to Understand

```
Server:
├── Hubs/Dispatch.cs          # SignalR hub (1000+ lines, core real-time logic)
├── Controllers/RideController.cs  # Ride CRUD operations
├── Data/DataTypes/Ride.cs    # Primary entity model
└── Data/DataRepositories/RideRepo.cs  # Database queries

Client Apps:
├── src/services/signalRService.js   # Real-time connection (different per app!)
├── src/services/apiService.js       # REST API wrappers
├── src/config/apiConfig.js          # Endpoint definitions + axios setup
└── src/contexts/AuthContext.jsx     # Authentication + SignalR initialization
```

## Development Commands

```bash
# Dispatcher web app
cd DispatchApp.client
npm install && npm run dev    # Runs on http://localhost:5173

# Driver mobile app
cd DriverApp
npm install && npx expo start  # Expo dev server

# Server
cd DispatchApp.Server
dotnet run                     # HTTP:5062, HTTPS:7170
```

## Network Configuration

- **Server IPs** configured in `environment.js` files - update `DEV_SERVER_IP` when network changes
- **CORS** configured in `Program.cs` for localhost ports and mobile dev server
- **SignalR**: Uses WebSockets with `skipNegotiation: true`

## Common Patterns

### Adding a New Ride Action

1. Add endpoint to server: `RideController.cs` → new `[HttpPost]` method
2. Add repository method: `RideRepo.cs`
3. Add endpoint constant: both `apiConfig.js` files
4. Add API wrapper: both `apiService.js` files
5. If real-time needed: Add SignalR event in `Dispatch.cs` and handlers in `signalRService.js`

### Adding SignalR Events

1. Server: Add method in `Dispatch.cs` with `Clients.All.SendAsync("EventName", data)`
2. Client: Register handler in `signalRService.js` → `this.connection.on('EventName', callback)`
3. Subscribe in component: `signalRService.onEventName(handler)` with cleanup on unmount

## Push Notifications (DriverApp Only)

### Architecture

Push notifications use **Expo's free push notification service**:
1. DriverApp gets an Expo Push Token on login
2. Token is stored in `Driver.ExpoPushToken` in the database
3. Server sends notifications via `Services/PushNotificationService.cs`
4. Expo forwards to Apple (APNs) or Google (FCM)

### Key Files

```
Server:
├── Services/PushNotificationService.cs  # Sends notifications to Expo's API
├── Data/DataTypes/Driver.cs             # ExpoPushToken field
└── Hubs/Dispatch.cs                     # Triggers notifications on events

DriverApp:
├── src/services/pushNotificationService.js  # Handles token & tap events
├── src/contexts/NotificationContext.jsx     # Manages navigation on tap
└── app.json                                 # Expo notification config
```

### Notification Types

| Type | Trigger | Recipients | Navigation |
|------|---------|------------|------------|
| `NEW_CALL` | New call created | All eligible drivers | Open Calls → scroll to call |
| `CALL_AVAILABLE_AGAIN` | Driver removed from call | All eligible drivers | Open Calls → scroll to call |
| `CALL_CANCELED` | Ride canceled | Assigned driver | Home screen |
| `CALL_UNASSIGNED` | Driver removed from ride | Affected driver | Home screen |
| `NEW_MESSAGE` | Dispatcher sends message | Target driver | Messages screen |

### Adding a New Push Notification

1. **Server**: In the relevant SignalR method (e.g., `Dispatch.cs`):
   ```csharp
   var pushToken = userRepo.GetDriverPushToken(driverId);
   await _pushNotificationService.SendPushNotificationAsync(
       pushToken,
       "Title",
       "Body text",
       new { type = "NOTIFICATION_TYPE", rideId = id, screen = "targetScreen" }
   );
   ```

2. **DriverApp**: In `NotificationContext.jsx`, add handler in `handleNotificationData`:
   ```javascript
   case 'NOTIFICATION_TYPE':
       setPendingNavigation({ screen: 'targetScreen', ... });
       break;
   ```

3. **Navigation**: Handle in `HomeScreen.jsx` `pendingNavigation` effect

### Testing Push Notifications

- **Expo Go**: Works on physical devices only (not simulators)
- **Test tool**: Use [Expo Push Notification Tool](https://expo.dev/notifications) with the token
- **Server logs**: Check console for `✅ Push notification sent` messages

## Gotchas

- **TypeScript**: Not used - both client apps are plain JSX
- **Driver vs Dispatcher auth**: Different storage keys (`driverAuth` vs `dispatcherAuth`)
- **CarType enum**: Must match between C# enum in `CarType.cs` and JS constants in `NewCallWizard.jsx`
- **Reassigned rides**: Check both `AssignedToId` AND `ReassignedToId` when querying ride ownership
- **Push notifications**: Only work on physical devices, not simulators/emulators
