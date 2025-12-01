"use client";

/**
 * Login Component
 * 
 * Main login page component that wraps the LoginForm.
 * Migrated from Material UI to shadcn/ui with Tailwind CSS.
 */

import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { LoginForm } from './LoginForm';
import type { LoginProps } from '@/types/login';
import Link from 'next/link';

export function Login({ onSubmit = () => { }, loading = false }: LoginProps) {
    const loginError = useAppStore((state) => state.user.loginError);

    return (
        <div className="min-h-screen flex items-start justify-center bg-muted/30 pt-8 px-4">
            <div className="w-full max-w-md mx-auto">
                <Card className="p-8 shadow-lg">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
                        </div>

                        {/* Login Form */}
                        <LoginForm
                            onSubmit={onSubmit}
                            loading={loading}
                            loginError={loginError}
                        />

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <Link
                                href="/auth/forgot"
                                className="text-sm text-primary hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Request Access Link */}
                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">No account? </span>
                            <Link
                                href="/auth/request-access"
                                className="text-primary hover:underline"
                            >
                                Request Access
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
