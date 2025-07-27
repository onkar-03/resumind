import { create } from 'zustand';

/**
 * ========== ZUSTAND STATE MANAGEMENT FOR PUTER.JS INTEGRATION ==========
 *
 * WHAT IS ZUSTAND?
 * Zustand is a lightweight state management library for React applications.
 * It provides a simple API to create global stores without the complexity of Redux.
 *
 * WHY ZUSTAND HERE?
 * - Manages Puter.js cloud platform state across the entire React app
 * - Provides type-safe access to authentication, file system, AI, and KV operations
 * - Handles loading states, errors, and async operations consistently
 * - No providers needed - just import and use in any component
 * - Perfect for managing external SDK integration like Puter.js
 *
 * WHERE ZUSTAND IS USED IN THIS FILE:
 *
 * 1. LINE ~125: create<PuterStore>() - Creates the main Zustand store
 *    - Wraps all Puter.js APIs with consistent error handling
 *    - Manages global state (loading, error, puterReady)
 *    - Provides reactive updates to React components
 *
 * 2. LINE ~138: setError() - Uses set() to update store state
 *    - Centralized error handling across all Puter operations
 *    - Automatically resets auth state when errors occur
 *
 * 3. LINE ~165: checkAuthStatus() - Uses set() for auth state updates
 *    - Updates user data and authentication status
 *    - Triggers reactive updates in components using auth state
 *
 * 4. LINE ~552-612: Return object - Exports the complete store interface
 *    - Organizes all Puter.js operations into logical sections
 *    - Provides consistent API for React components to consume
 */

/**
 * Global type declarations for the Puter.js SDK
 * This extends the Window interface to include Puter's API methods
 * Puter.js is a cloud computing platform that provides file storage, AI, and authentication services
 */
declare global {
  interface Window {
    puter: {
      // Authentication API - handles user sign in/out and session management
      auth: {
        getUser: () => Promise<PuterUser>;
        isSignedIn: () => Promise<boolean>;
        signIn: () => Promise<void>;
        signOut: () => Promise<void>;
      };
      // File System API - handles file operations like read, write, upload, delete
      fs: {
        write: (
          path: string,
          data: string | File | Blob,
        ) => Promise<File | undefined>;
        read: (path: string) => Promise<Blob>;
        upload: (file: File[] | Blob[]) => Promise<FSItem>;
        delete: (path: string) => Promise<void>;
        readdir: (path: string) => Promise<FSItem[] | undefined>;
      };
      // AI API - provides chat capabilities and image-to-text conversion
      ai: {
        chat: (
          prompt: string | ChatMessage[],
          imageURL?: string | PuterChatOptions,
          testMode?: boolean,
          options?: PuterChatOptions,
        ) => Promise<Object>;
        img2txt: (
          image: string | File | Blob,
          testMode?: boolean,
        ) => Promise<string>;
      };
      // Key-Value Store API - simple database for storing app data
      kv: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<boolean>;
        delete: (key: string) => Promise<boolean>;
        list: (pattern: string, returnValues?: boolean) => Promise<string[]>;
        flush: () => Promise<boolean>;
      };
    };
  }
}

/**
 * Main store interface for managing Puter.js integration
 * Uses Zustand for state management to provide a clean React interface
 *
 * Why Zustand? It's lightweight, doesn't require providers, and works well with TypeScript
 * This store acts as a wrapper around Puter.js APIs to provide:
 * - Error handling and loading states
 * - Type safety for all operations
 * - Consistent interface across the application
 */
interface PuterStore {
  // Global state management
  isLoading: boolean; // Tracks if any async operation is in progress
  error: string | null; // Stores error messages from failed operations
  puterReady: boolean; // Indicates if Puter.js SDK has loaded successfully

  // Authentication management - handles user sessions and login state
  auth: {
    user: PuterUser | null; // Current logged-in user data
    isAuthenticated: boolean; // Quick check for auth status
    signIn: () => Promise<void>; // Initiate user sign-in flow
    signOut: () => Promise<void>; // Sign out current user
    refreshUser: () => Promise<void>; // Refresh user data from server
    checkAuthStatus: () => Promise<boolean>; // Check if user is currently signed in
    getUser: () => PuterUser | null; // Get current user without API call
  };

  // File system operations - wrapped with error handling and type safety
  fs: {
    write: (
      path: string,
      data: string | File | Blob,
    ) => Promise<File | undefined>;
    read: (path: string) => Promise<Blob | undefined>;
    upload: (file: File[] | Blob[]) => Promise<FSItem | undefined>;
    delete: (path: string) => Promise<void>;
    readDir: (path: string) => Promise<FSItem[] | undefined>;
  };

  // AI operations - for resume analysis and feedback generation
  ai: {
    chat: (
      prompt: string | ChatMessage[],
      imageURL?: string | PuterChatOptions,
      testMode?: boolean,
      options?: PuterChatOptions,
    ) => Promise<AIResponse | undefined>;
    // Custom method for generating resume feedback using AI
    feedback: (
      path: string,
      message: string,
    ) => Promise<AIResponse | undefined>;
    img2txt: (
      image: string | File | Blob,
      testMode?: boolean,
    ) => Promise<string | undefined>;
  };

  // Key-value storage - for app settings and cached data
  kv: {
    get: (key: string) => Promise<string | null | undefined>;
    set: (key: string, value: string) => Promise<boolean | undefined>;
    delete: (key: string) => Promise<boolean | undefined>;
    list: (
      pattern: string,
      returnValues?: boolean,
    ) => Promise<string[] | KVItem[] | undefined>;
    flush: () => Promise<boolean | undefined>;
  };

  // Store management methods
  init: () => void; // Initialize Puter.js and check auth status
  clearError: () => void; // Clear any stored error messages
}

/**
 * Helper function to safely access the Puter.js SDK
 * Returns null if running on server-side or if Puter.js hasn't loaded yet
 *
 * Why this approach?
 * - Prevents SSR issues by checking for window object
 * - Provides a single point of access with null checking
 * - Makes the code more testable and predictable
 */
const getPuter = (): typeof window.puter | null =>
  typeof window !== 'undefined' && window.puter ? window.puter : null;

/**
 * Main Zustand store for Puter.js integration
 *
 * This store provides a React-friendly interface to Puter.js services:
 * - Handles loading states and errors consistently
 * - Manages authentication state across the app
 * - Wraps all Puter.js APIs with proper error handling
 * - Provides type safety for all operations
 */
export const usePuterStore = create<PuterStore>((set, get) => {
  /**
   * Centralized error handling function
   * Sets error state and resets auth when errors occur
   *
   * Why reset auth on error? Many Puter operations fail when not authenticated,
   * so we assume auth issues and reset to force re-authentication
   */
  const setError = (msg: string) => {
    set({
      error: msg,
      isLoading: false,
      auth: {
        user: null,
        isAuthenticated: false,
        signIn: get().auth.signIn,
        signOut: get().auth.signOut,
        refreshUser: get().auth.refreshUser,
        checkAuthStatus: get().auth.checkAuthStatus,
        getUser: get().auth.getUser,
      },
    });
  };

  /**
   * Check current authentication status with Puter
   *
   * This function:
   * 1. Verifies Puter.js is available
   * 2. Checks if user is signed in
   * 3. Fetches user data if authenticated
   * 4. Updates store state accordingly
   *
   * Returns boolean indicating auth status for immediate use
   */
  const checkAuthStatus = async (): Promise<boolean> => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const isSignedIn = await puter.auth.isSignedIn();
      if (isSignedIn) {
        // User is authenticated - fetch their data
        const user = await puter.auth.getUser();
        set({
          auth: {
            user,
            isAuthenticated: true,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => user,
          },
          isLoading: false,
        });
        return true;
      } else {
        // User is not authenticated - clear auth state
        set({
          auth: {
            user: null,
            isAuthenticated: false,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => null,
          },
          isLoading: false,
        });
        return false;
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to check auth status';
      setError(msg);
      return false;
    }
  };

  /**
   * Initiate user sign-in flow
   *
   * This triggers Puter's authentication flow (usually opens a popup/redirect)
   * After successful sign-in, automatically checks auth status to update store
   */
  const signIn = async (): Promise<void> => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await puter.auth.signIn();
      // After successful sign-in, update our local state
      await checkAuthStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
    }
  };

  /**
   * Sign out the current user
   *
   * Clears both Puter's session and our local auth state
   * Always clears local state even if Puter sign-out fails
   */
  const signOut = async (): Promise<void> => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await puter.auth.signOut();
      // Clear local auth state after successful sign-out
      set({
        auth: {
          user: null,
          isAuthenticated: false,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => null,
        },
        isLoading: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign out failed';
      setError(msg);
    }
  };

  /**
   * Refresh user data from Puter servers
   *
   * Useful when user data might have changed (profile updates, etc.)
   * Assumes user is already authenticated
   */
  const refreshUser = async (): Promise<void> => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const user = await puter.auth.getUser();
      set({
        auth: {
          user,
          isAuthenticated: true,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => user,
        },
        isLoading: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh user';
      setError(msg);
    }
  };

  /**
   * Initialize the Puter store
   *
   * This function:
   * 1. Checks if Puter.js is already loaded
   * 2. If not, polls every 100ms until it loads (with 10s timeout)
   * 3. Once loaded, checks authentication status
   *
   * Why polling? Puter.js loads asynchronously and we need to wait for it
   * The timeout prevents infinite waiting if Puter fails to load
   */
  const init = (): void => {
    const puter = getPuter();
    if (puter) {
      // Puter is already loaded - proceed immediately
      set({ puterReady: true });
      checkAuthStatus();
      return;
    }

    // Puter not yet loaded - start polling
    const interval = setInterval(() => {
      if (getPuter()) {
        clearInterval(interval);
        set({ puterReady: true });
        checkAuthStatus();
      }
    }, 100); // Check every 100ms

    // Timeout after 10 seconds to prevent infinite waiting
    setTimeout(() => {
      clearInterval(interval);
      if (!getPuter()) {
        setError('Puter.js failed to load within 10 seconds');
      }
    }, 10000);
  };

  // ========== FILE SYSTEM OPERATIONS ==========
  /**
   * All fs operations are wrapped to provide consistent error handling
   * and null checks for the Puter SDK
   */

  const write = async (path: string, data: string | File | Blob) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    return puter.fs.write(path, data);
  };

  const readDir = async (path: string) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    return puter.fs.readdir(path);
  };

  const readFile = async (path: string) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    return puter.fs.read(path);
  };

  const upload = async (files: File[] | Blob[]) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    return puter.fs.upload(files);
  };

  const deleteFile = async (path: string) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    return puter.fs.delete(path);
  };

  // ========== AI OPERATIONS ==========
  /**
   * AI operations for resume analysis and feedback generation
   */

  /**
   * AI operations for resume analysis and feedback generation
   */

  const chat = async (
    prompt: string | ChatMessage[],
    imageURL?: string | PuterChatOptions,
    testMode?: boolean,
    options?: PuterChatOptions,
  ) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    // Cast return type to match our interface expectations
    return puter.ai.chat(prompt, imageURL, testMode, options) as Promise<
      AIResponse | undefined
    >;
  };

  /**
   * Generate feedback for a resume file
   *
   * This custom method:
   * 1. Uses Puter's AI chat with file attachment capability
   * 2. Sends the resume file and analysis prompt to Claude
   * 3. Returns structured feedback for the resume
   *
   * Why Claude specifically? It provides detailed, nuanced analysis
   * perfect for resume feedback and improvement suggestions
   */
  const feedback = async (path: string, message: string) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }

    return puter.ai.chat(
      [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              puter_path: path, // Reference to uploaded resume file
            },
            {
              type: 'text',
              text: message, // Analysis prompt/instructions
            },
          ],
        },
      ],
      { model: 'claude-3-7-sonnet' }, // Use Claude for detailed analysis
    ) as Promise<AIResponse | undefined>;
  };

  const img2txt = async (image: string | File | Blob, testMode?: boolean) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    return puter.ai.img2txt(image, testMode);
  };

  // ========== KEY-VALUE STORE OPERATIONS ==========
  /**
   * Simple database operations for app settings and cached data
   * Useful for storing user preferences, cached analysis results, etc.
   */

  /**
   * Simple database operations for app settings and cached data
   * Useful for storing user preferences, cached analysis results, etc.
   */

  const getKV = async (key: string) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    return puter.kv.get(key);
  };

  const setKV = async (key: string, value: string) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    return puter.kv.set(key, value);
  };

  const deleteKV = async (key: string) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    return puter.kv.delete(key);
  };

  const listKV = async (pattern: string, returnValues?: boolean) => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    if (returnValues === undefined) {
      returnValues = false; // Default to only returning keys
    }
    return puter.kv.list(pattern, returnValues);
  };

  const flushKV = async () => {
    const puter = getPuter();
    if (!puter) {
      setError('Puter.js not available');
      return;
    }
    return puter.kv.flush();
  };

  // ========== STORE RETURN OBJECT ==========
  /**
   * Return the complete store object with all methods and state
   *
   * The store is organized into logical sections:
   * - Global state (loading, error, puterReady)
   * - Authentication methods and state
   * - File system operations
   * - AI operations
   * - Key-value store operations
   * - Utility methods (init, clearError)
   */
  return {
    // Global state management
    isLoading: true, // Start with loading state until Puter initializes
    error: null, // No initial errors
    puterReady: false, // Puter not ready until initialized

    // Authentication state and methods
    auth: {
      user: null, // No user initially
      isAuthenticated: false, // Not authenticated initially
      signIn, // Sign-in method
      signOut, // Sign-out method
      refreshUser, // Refresh user data method
      checkAuthStatus, // Check auth status method
      getUser: () => get().auth.user, // Get current user from state
    },

    // File system operations with consistent interface
    fs: {
      write: (path: string, data: string | File | Blob) => write(path, data),
      read: (path: string) => readFile(path),
      readDir: (path: string) => readDir(path),
      upload: (files: File[] | Blob[]) => upload(files),
      delete: (path: string) => deleteFile(path),
    },

    // AI operations for resume analysis
    ai: {
      chat: (
        prompt: string | ChatMessage[],
        imageURL?: string | PuterChatOptions,
        testMode?: boolean,
        options?: PuterChatOptions,
      ) => chat(prompt, imageURL, testMode, options),
      feedback: (path: string, message: string) => feedback(path, message),
      img2txt: (image: string | File | Blob, testMode?: boolean) =>
        img2txt(image, testMode),
    },

    // Key-value store for app data
    kv: {
      get: (key: string) => getKV(key),
      set: (key: string, value: string) => setKV(key, value),
      delete: (key: string) => deleteKV(key),
      list: (pattern: string, returnValues?: boolean) =>
        listKV(pattern, returnValues),
      flush: () => flushKV(),
    },

    // Utility methods
    init, // Initialize the store
    clearError: () => set({ error: null }), // Clear any error state
  };
});

/**
 * ========== FILE SUMMARY: WHAT WAS CREATED AND WHY ==========
 *
 * This file creates a complete Zustand store for integrating Puter.js cloud services
 * into the resume analyzer React application. Here's what each part does:
 *
 * 🔧 CORE COMPONENTS CREATED:
 *
 * 1. GLOBAL TYPE DECLARATIONS (Lines 68-109)
 *    └── Extends Window interface with Puter.js API types
 *    └── Provides TypeScript support for auth, fs, ai, and kv operations
 *    └── Ensures type safety when calling Puter.js methods
 *
 * 2. PUTERSTORE INTERFACE (Lines 119-177)
 *    └── Defines the complete store structure and methods
 *    └── Organizes state into logical sections (auth, fs, ai, kv)
 *    └── Provides type contracts for all store operations
 *
 * 3. GETPUTER HELPER FUNCTION (Lines 188-191)
 *    └── Safely accesses Puter.js SDK with null checks
 *    └── Prevents SSR errors by checking window object
 *    └── Single point of access for all Puter operations
 *
 * 4. MAIN ZUSTAND STORE (Lines 200-665)
 *    └── Creates the reactive state management system
 *    └── Wraps all Puter.js APIs with error handling
 *    └── Manages loading states and user authentication
 *
 * 🎯 KEY FUNCTIONS CREATED:
 *
 * • setError() - Centralized error handling across all operations
 * • checkAuthStatus() - Verifies and updates user authentication state
 * • signIn() - Handles user login flow with automatic state updates
 * • signOut() - Manages user logout and state cleanup
 * • refreshUser() - Updates user data from Puter servers
 * • init() - Initializes Puter.js with polling and timeout logic
 *
 * • File System Operations:
 *   - write() - Save files to Puter cloud storage
 *   - readFile() - Read files from cloud storage
 *   - readDir() - List directory contents
 *   - upload() - Upload files to cloud storage
 *   - deleteFile() - Remove files from storage
 *
 * • AI Operations:
 *   - chat() - General AI chat interface
 *   - feedback() - Custom resume analysis using Claude AI
 *   - img2txt() - Convert images to text
 *
 * • Key-Value Store Operations:
 *   - getKV() - Retrieve app settings/cached data
 *   - setKV() - Store app settings/cached data
 *   - deleteKV() - Remove stored data
 *   - listKV() - List stored keys/values
 *   - flushKV() - Clear all stored data
 *
 * 🚀 WHAT THIS ENABLES FOR THE RESUME ANALYZER:
 *
 * ✅ User Authentication - Persistent login across app
 * ✅ Resume Upload - Store PDF files in cloud
 * ✅ AI Analysis - Generate feedback using Claude AI
 * ✅ Data Persistence - Save analysis results and user preferences
 * ✅ Error Handling - Consistent error management throughout app
 * ✅ Loading States - Show progress indicators for all operations
 * ✅ Type Safety - Full TypeScript support for all cloud operations
 * ✅ Reactive UI - Components automatically update when state changes
 *
 * 📱 HOW COMPONENTS USE THIS STORE:
 *
 * Any React component can import and use this store:
 * ```typescript
 * import { usePuterStore } from '~/lib/puter';
 *
 * function ResumeAnalyzer() {
 *   const { auth, fs, ai, isLoading, error } = usePuterStore();
 *
 *   --- Upload resume and get AI feedback
 *   const analyzeResume = async (file) => {
 *     const uploaded = await fs.upload([file]);
 *     const feedback = await ai.feedback(uploaded.path, "Analyze this resume");
 *     return feedback;
 *   };
 * }
 * ```
 *
 * This architecture provides a clean separation between cloud operations and UI,
 * making the resume analyzer scalable, maintainable, and type-safe.
 */
