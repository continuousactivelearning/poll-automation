// File: frontend/src/contexts/AuthContext.tsx
// import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// interface User {
//   id: string;
//   fullName: string;
//   email: string;
//   role: string;
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string) => Promise<void>;
//   register: (fullName: string, email: string, password: string) => Promise<void>;
//   logout: () => void;
//   forgotPassword: (email: string) => Promise<void>;
//   resetPassword: (token: string, password: string) => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const storedUser = localStorage.getItem('user');
//     if (storedUser) setUser(JSON.parse(storedUser));
//     setIsLoading(false);
//   }, []);

//   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// const login = async (email: string, password: string) => {
//   const res = await fetch(`${API_URL}/auth/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, password }),
//   });

//   if (!res.ok) {
//     // Attempt to parse a more specific error message from the API response
//     // If your API sends back { message: "Invalid credentials" } for example
//     const errorData = await res.json();
//     throw new Error(errorData.message || "Login failed"); // Use API message or a generic one
//   }

//   const data = await res.json();
//   setUser(data.user);
//   localStorage.setItem("user", JSON.stringify(data.user));
//   localStorage.setItem("token", data.token);
// };

//   const register = async (fullName: string, email: string, password: string) => {
//     const res = await fetch(`${API_URL}/auth/register`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ fullName, email, password }),
//     });
//     if (!res.ok) {
//       const error = await res.json();
//       throw new Error(error.message || "Registration failed");
//     }
//     const data = await res.json();
//     setUser(data.user);
//     if(data){
//     localStorage.setItem("user", JSON.stringify(data.user));
//     localStorage.setItem("token", data.token);
//     }
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem('user');
//     localStorage.removeItem('token');
//   };

//   const forgotPassword = async (email: string) => {
//     const res = await fetch(`${API_URL}/auth/forgot-password`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email }),
//     });
//     if (!res.ok) {
//       const error = await res.json();
//       throw new Error(error.message || "Failed to send reset email");
//     }
//     // Optionally return message
//     return await res.json();
//   };

//   const resetPassword = async (token: string, password: string) => {
//     const res = await fetch(`${API_URL}/auth/reset-password`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ token, password }),
//     });
//     const data = await res.json();
//     if (!res.ok) {
//       throw new Error(data.message || "Failed to reset password");
//     }
//     return data;
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, register, logout, forgotPassword, resetPassword }}>
//       {!isLoading && children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used within AuthProvider");
//   return context;
// }
// apps/frontend/src/contexts/AuthContext.tsx
// apps/frontend/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
// import { io, Socket } from "socket.io-client"; // Temporarily disabled
import { apiService } from "../utils/api"; // Make sure apiService is available
import toast from 'react-hot-toast'; // For notifications

// --- Define Types ---
interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'host' | 'student';
  avatar?: string;
  bio?: string;
}

// --- NEW: Define the structure for an active room ---
interface ActiveRoom {
  _id: string;
  name: string;
  code: string;
}

// --- MODIFIED: Add new properties to the context type ---
interface AuthContextType {
  user: User | null;
  token: string | null;
  socket: any; // Socket | null; // Temporarily disabled
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, role: 'host' | 'student') => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (token: string, password: string) => Promise<any>;
  updateUser: (updatedData: Partial<User>) => void;
  // --- NEW PROPERTIES FOR SESSION MANAGEMENT ---
  activeRoom: ActiveRoom | null;
  isCreatingRoom: boolean;
  createRoom: (roomName: string) => Promise<void>;
  destroyRoom: (navigationCallback?: () => void) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define constants
const API_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";
const ROOM_STORAGE_KEY = 'pollgen_active_room'; // Key to save active room in localStorage

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<any>(null); // Socket | null; // Temporarily disabled
  const [isLoading, setIsLoading] = useState(true);

  // --- NEW STATE FOR ROOM MANAGEMENT ---
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // --- EFFECT 1: Load User, Token, and check for a stored Room on initial App load ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const storedRoom = localStorage.getItem(ROOM_STORAGE_KEY);
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);

        // --- NEW: If a room was stored, check if it's still valid ---
        if (storedRoom) {
          const roomData = JSON.parse(storedRoom);
          // We will verify its status against the backend inside the socket effect, once authenticated.
          setActiveRoom(roomData);
        }
      } catch {
        localStorage.clear(); // Clear all bad data
      }
    }
    setIsLoading(false);
  }, []);
  
  // --- EFFECT 2: Manage Socket Connection and check for active session ---
  useEffect(() => {
    console.log('🔐 AuthContext useEffect - Token:', !!token, 'User:', !!user);
    console.log('🔐 User role:', user?.role);
    
    if (token && user) {
      console.log('🔌 Creating new socket connection with token');
      console.log('🌐 Socket URL:', API_URL);
      console.log('🔑 Token length:', token.length);
      console.log('👤 User role:', user.role);
      
      // Socket.IO re-enabled for poll functionality
      // Note: Socket.IO (socket.io protocol) and ASR WebSocket (ws:// protocol) use different ports/protocols and won't conflict
      console.log('✅ Socket.IO connection enabled for polls - separate from ASR WebSocket');
      
      // Import socket.io-client dynamically to avoid build issues
      import('socket.io-client').then(({ io }) => {
        console.log('📦 Socket.IO library loaded, creating connection...');
        const newSocket = io(API_URL, {
          auth: { token },
          transports: ['polling', 'websocket'], // Use polling first to avoid ASR WebSocket conflicts
          timeout: 10000, // 10 second timeout
          forceNew: true, // Force new connection
          upgrade: false // Disable WebSocket upgrade to avoid conflicts with ASR WebSocket
        });
        
        console.log('🔗 Socket instance created, setting up event handlers...');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('✅ [Socket.IO] Connected with ID:', newSocket.id);
            console.log('🎭 User role during connection:', user.role);
            // --- NEW: Once connected, if user is a host, check for an active session ---
            if (user.role === 'host') {
              console.log('👑 Host detected, checking active session...');
              checkHostActiveSession(newSocket);
            } else if (user.role === 'student') {
              console.log('🎓 Student connected successfully!');
            }
        });
        
        newSocket.on('connect_error', (error) => {
          console.log('❌ Socket connection error:', error);
          console.log('🔍 Error details:', error.message, error.type);
          // Retry connection after 5 seconds with limited retries
          setTimeout(() => {
            if (newSocket.connected === false) {
              console.log('🔄 Retrying socket connection...');
              newSocket.connect();
            }
          }, 5000);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
        });
        
       if (user.role === 'host') {
            newSocket.on('student-joined-notification', (data) => {
                toast.success(data.message, {
                    icon: '👋',
                    position: 'top-right' // Position it nicely
                });
            });
        }
      });

      return () => {
        if (socket) {
          socket.disconnect();
          socket.off('student-joined-notification');
          setSocket(null);
        }
      };
    }
  }, [token, user]); // Depend on user as well

//   // --- MODIFIED: `login` function is unchanged, but its effect will trigger the check ---
//   const login = async (email: string, password: string) => {
//     const res = await fetch(`${API_URL}/auth/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, password }),
//     });
//     if (!res.ok) {
//       const err = await res.json();
//       throw new Error(err.message || "Login failed");
//     }
//     const { user: loggedInUser, token: authToken } = await res.json();
//     setUser(loggedInUser);
//     setToken(authToken); // This triggers the socket connection and session check effect
//     localStorage.setItem("user", JSON.stringify(loggedInUser));
//     localStorage.setItem("token", authToken);
//   };

//   // --- `register` function is unchanged ---
//   const register = async (fullName: string, email: string, password: string, role: 'host' | 'student' = 'student') => {
//     const res = await fetch(`${API_URL}/auth/register`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ fullName, email, password, role }),
//     });
//     if (!res.ok) {
//         const err = await res.json();
//         throw new Error(err.message || "Registration failed");
//     }
//   };

//   // --- MODIFIED: `logout` now also clears the active room ---
//   const logout = () => {
//     setUser(null);
//     setToken(null);
//     localStorage.removeItem("user");
//     localStorage.removeItem("token");
//     // --- NEW ---
//     localStorage.removeItem(ROOM_STORAGE_KEY);
//     setActiveRoom(null);
//   };
  

//    const forgotPassword = async (email: string) => {
//     const res = await fetch(`${API_URL}/auth/forgot-password`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email }),
//     });
//     if (!res.ok) {
//       const err = await res.json();
//       throw new Error(err.message || "Failed to send reset email");
//     }
//     return await res.json();
//   };

//   const resetPassword = async (token: string, password: string) => {
//     const res = await fetch(`${API_URL}/auth/reset-password`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ token, password }),
//     });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.message || "Failed to reset password");
//     return data;
//   };
  // --- `updateUser` and other auth functions are unchanged ---
 const updateUser = (updatedData: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      const newUser = { ...currentUser, ...updatedData };
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  };  
 // --- REFACTORED: All auth functions now use apiService ---

  const login = async (email: string, password: string) => {
    // No more fetch! Use the clean, centralized apiService.
    const response = await apiService.login({ email, password });
    
    const { user: loggedInUser, token: authToken } = response.data;
    setUser(loggedInUser);
    setToken(authToken); // This will trigger the useEffect to connect the socket
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    localStorage.setItem("token", authToken);
  };

  const register = async (fullName: string, email: string, password: string, role: 'host' | 'student') => {
    await apiService.register({ fullName, email, password, role });
    // Don't auto-login. Let them log in separately.
  };

  const forgotPassword = async (email: string) => {
    return await apiService.forgotPassword(email);
  };

  const resetPassword = async (token: string, password: string) => {
    return await apiService.resetPassword(token, password);
  };

  // --- MODIFIED LOGOUT ---
  const logout = () => {
    socket?.disconnect(); // Disconnect socket first
    setUser(null);
    setToken(null);
    setActiveRoom(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem(ROOM_STORAGE_KEY);
  };


  // --- NEW HELPER AND PUBLIC FUNCTIONS FOR ROOM MANAGEMENT ---

 
  const checkHostActiveSession = async (currentSocket: any) => {
    try {
        const response = await apiService.getActiveRoom();
        if (response.data) {
            const roomData = response.data;
            setActiveRoom(roomData);
            localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(roomData));
            currentSocket.emit('host-join-room', roomData._id);
        } else {
            // If API returns nothing, ensure local state is clear
            localStorage.removeItem(ROOM_STORAGE_KEY);
            setActiveRoom(null);
        }
    } catch (error) {
        console.log("No active session found for host.");
        localStorage.removeItem(ROOM_STORAGE_KEY);
        setActiveRoom(null);
    }
  };

  const createRoom = async (roomName: string) => {
    if (!roomName.trim()) {
      toast.error("Room name is required.");
      return;
    }

    setIsCreatingRoom(true);
    const creationToast = toast.loading("Creating session...");
    try {
      const response = await apiService.createRoom({ name: roomName });
      const newRoom = response.data;
      setActiveRoom(newRoom);
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(newRoom));
      // Skip socket emit since it's disabled
      toast.success(`Session "${roomName}" is now active!`, { id: creationToast });
    } catch (err: any) {
      console.error('Create room error:', err);
      toast.error(err.response?.data?.message || 'Failed to create session.', { id: creationToast });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const destroyRoom = async (navigationCallback?: () => void) => {
    if (!activeRoom || !socket) return;
    const destructionToast = toast.loading("Ending session...");
    try {
      console.log('🏁 Ending session:', activeRoom._id);
      
      // Emit host-end-session to backend to:
      // 1. Mark room as inactive  
      // 2. Generate session report
      // 3. Notify all students
      socket.emit('host-end-session', activeRoom._id);
      
      // Clear local state
      localStorage.removeItem(ROOM_STORAGE_KEY);
      setActiveRoom(null);
      
      toast.success("Session ended successfully!", { id: destructionToast });
      
      // Navigate to leaderboard if callback provided
      if (navigationCallback) {
        setTimeout(() => navigationCallback(), 1000);
      }
      
    } catch (error) {
      console.error('Destroy room error:', error);
      toast.error("Failed to properly end session.", { id: destructionToast });
    }
  };

  // const destroyRoom = async () => {
  //   if (!activeRoom || !socket) return;
  //   const destructionToast = toast.loading("Ending session...");
  //   try {
  //       // You might want a backend endpoint to explicitly set isActive=false
  //       // For now, we'll just notify clients and clear local state.
        
  //       // Notify all students in the room that the session is over
  //  socket.emit('host-end-session', activeRoom._id);         
  //       localStorage.removeItem(ROOM_STORAGE_KEY);
  //       setActiveRoom(null);
  //       toast.success("Session has been closed.", { id: destructionToast });
  //   } catch (error) {
  //       toast.error("Failed to properly end session.", { id: destructionToast });
  //   }
  // };

  return (
   <AuthContext.Provider
      value={{
        user,
        token,
        socket,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updateUser,
        isAuthenticated: !!user,
        isLoading,
        // --- NEW VALUES EXPOSED BY THE CONTEXT ---
        activeRoom,
        isCreatingRoom,
        createRoom,
        destroyRoom,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}