# Frontend API Integration Guide

This guide explains how to use the API services to connect your React Native frontend to the FastAPI backend.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install axios
```

### 2. Import Services
```typescript
import { authService, groupsService, sessionsService } from '../services';
```

### 3. Use Custom Hooks
```typescript
import { useAuth, useGroups, useSessions } from '../hooks';

function MyComponent() {
  const { user, login, logout } = useAuth();
  const { groups, createGroup } = useGroups();
  const { sessions, startSession } = useSessions();
  
  // Your component logic here
}
```

## 📁 File Structure

```
frontend/
├── services/
│   ├── api.ts              # Base API configuration
│   ├── auth.ts             # Authentication service
│   ├── groups.ts           # Groups service
│   ├── sessions.ts         # Sessions service
│   ├── notifications.ts    # Notifications service
│   └── index.ts           # Export all services
├── hooks/
│   ├── useAuth.tsx         # Authentication hook
│   ├── useGroups.tsx       # Groups management hook
│   └── useSessions.tsx    # Sessions management hook
└── app/
    └── (tabs)/
        └── home-api.tsx    # Example component using API
```

## 🔧 Configuration

### API Base URL
The API base URL is configured in `services/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000'  // Development
  : 'https://your-ec2-instance.com';  // Production
```

### Authentication
The API client automatically adds the auth token to requests:

```typescript
// Token is automatically added to headers
const response = await api.get('/api/v1/groups');
```

## 🎯 Usage Examples

### Authentication

```typescript
import { useAuth } from '../hooks/useAuth';

function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  
  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
      // User is now logged in
    } catch (error) {
      // Handle login error
    }
  };
}
```

### Groups Management

```typescript
import { useGroups } from '../hooks/useGroups';

function GroupsScreen() {
  const { groups, createGroup, isLoading, error } = useGroups();
  
  const handleCreateGroup = async (groupData) => {
    try {
      const newGroup = await createGroup(groupData);
      // Group created successfully
    } catch (error) {
      // Handle error
    }
  };
}
```

### Sessions Management

```typescript
import { useSessions } from '../hooks/useSessions';

function SessionsScreen() {
  const { sessions, startSession, endSession } = useSessions();
  
  const handleStartSession = async (sessionId) => {
    try {
      await startSession(sessionId);
      // Session started
    } catch (error) {
      // Handle error
    }
  };
}
```

## 🔄 Data Flow

1. **Component** calls custom hook (e.g., `useGroups`)
2. **Hook** calls service function (e.g., `groupsService.getGroups()`)
3. **Service** makes HTTP request via `api` client
4. **API Client** adds auth token and handles responses
5. **Hook** updates state and returns data to component
6. **Component** re-renders with new data

## 🛡️ Error Handling

All services include error handling:

```typescript
const { groups, error, isLoading } = useGroups();

if (error) {
  return <ErrorComponent message={error} />;
}

if (isLoading) {
  return <LoadingComponent />;
}
```

## 🔐 Authentication Flow

1. User logs in → `authService.login()`
2. Token stored → `tokenManager.setToken()`
3. Token added to requests → API interceptor
4. Token expires → Auto-refresh or logout
5. User logs out → `authService.logout()`

## 📱 React Native Considerations

### Storage
For React Native, replace `localStorage` with secure storage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const tokenManager = {
  setToken: async (token: string) => {
    await AsyncStorage.setItem('auth_token', token);
  },
  getToken: async () => {
    return await AsyncStorage.getItem('auth_token');
  },
  removeToken: async () => {
    await AsyncStorage.removeItem('auth_token');
  },
};
```

### Network Configuration
For Android, add network security config:

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

## 🚀 Migration from Mock Data

To migrate from mock data to real API calls:

1. **Replace static imports**:
   ```typescript
   // Before
   import { groupSummaries } from '../constants/groups';
   
   // After
   import { useGroups } from '../hooks/useGroups';
   ```

2. **Update state management**:
   ```typescript
   // Before
   const [groups, setGroups] = useState(groupSummaries);
   
   // After
   const { groups, isLoading, error } = useGroups();
   ```

3. **Handle loading and error states**:
   ```typescript
   if (isLoading) return <LoadingComponent />;
   if (error) return <ErrorComponent error={error} />;
   ```

## 🧪 Testing

Test API services with mock data:

```typescript
// Mock the API service
jest.mock('../services/groups', () => ({
  groupsService: {
    getGroups: jest.fn().mockResolvedValue(mockGroups),
  },
}));
```

## 📚 API Endpoints

The services connect to these backend endpoints:

- **Auth**: `/api/v1/auth/*`
- **Groups**: `/api/v1/groups/*`
- **Sessions**: `/api/v1/sessions/*`
- **Notifications**: `/api/v1/notifications/*`

See the backend documentation for complete endpoint details.

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend allows frontend origin
2. **Network Errors**: Check API base URL configuration
3. **Auth Errors**: Verify token storage and refresh logic
4. **Type Errors**: Ensure TypeScript types match API responses

### Debug Mode

Enable debug logging:

```typescript
// In services/api.ts
if (__DEV__) {
  apiClient.interceptors.request.use(request => {
    console.log('API Request:', request);
    return request;
  });
}
```

## 📖 Next Steps

1. **Replace mock data** in existing components
2. **Add error boundaries** for better error handling
3. **Implement offline support** with data caching
4. **Add push notifications** for real-time updates
5. **Optimize performance** with data pagination

---

Your frontend is now ready to connect to the FastAPI backend! 🎉
