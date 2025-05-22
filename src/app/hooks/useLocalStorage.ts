import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Use a state that can represent the "uninitialized" state on the server
  const [storedValue, setStoredValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    // This code runs only on the client after the component mounts
    if (typeof window === 'undefined') return; // Ensure client-side only

    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      const value = item ? JSON.parse(item) : initialValue;
      setStoredValue(value); // Update state with actual localStorage value
    } catch (error) {
      // If error, return initialValue
      console.error('Error reading from localStorage', error);
      setStoredValue(initialValue);
    }

    // Keep the storage event listener logic here as it's client-side
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error parsing localStorage change', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, [key, initialValue]); // Add initialValue to dependency array

  // Update the stored value and state
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue as T) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  };

  // While storedValue is undefined (server render or before useEffect), return initialValue
   // The useEffect will correct it later.
  return [storedValue === undefined ? initialValue : storedValue, setValue];
} 