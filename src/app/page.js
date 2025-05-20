'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api';
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuthenticated = await authService.checkAuth();
        if (isAuthenticated) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="text-center">
        {loading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        <h1 className="mt-6 text-4xl font-bold text-white">NABIL Restaurant</h1>
        <p className="mt-2 text-xl text-white">Management System</p>
      </div>
    </div>
  );
}
