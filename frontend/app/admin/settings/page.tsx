"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Settings,
    Database,
    Shield,
    Bell,
    Palette,
    Globe,
    Save
} from "lucide-react";
import { useState } from "react";

export default function AdminSettingsPage() {
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 1000);
    };

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                            <p className="text-gray-600 mt-2">Configure system preferences and options</p>
                        </div>

                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>

                    {/* Settings Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* General Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Settings className="h-5 w-5 mr-2" />
                                    General Settings
                                </CardTitle>
                                <CardDescription>Basic system configuration</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">System Name</p>
                                        <p className="text-sm text-gray-500">CRM Workflow System</p>
                                    </div>
                                    <Badge variant="secondary">Default</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Default Language</p>
                                        <p className="text-sm text-gray-500">English (US)</p>
                                    </div>
                                    <Badge variant="secondary">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Timezone</p>
                                        <p className="text-sm text-gray-500">UTC+6 (Asia/Dhaka)</p>
                                    </div>
                                    <Badge variant="secondary">Active</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Security Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Shield className="h-5 w-5 mr-2" />
                                    Security
                                </CardTitle>
                                <CardDescription>Security and authentication settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Password Policy</p>
                                        <p className="text-sm text-gray-500">Minimum 8 characters</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Session Timeout</p>
                                        <p className="text-sm text-gray-500">24 hours</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Two-Factor Auth</p>
                                        <p className="text-sm text-gray-500">Optional for users</p>
                                    </div>
                                    <Badge variant="secondary">Optional</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Database Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Database className="h-5 w-5 mr-2" />
                                    Database
                                </CardTitle>
                                <CardDescription>Database connection and backup settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Connection Status</p>
                                        <p className="text-sm text-gray-500">PostgreSQL</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Auto Backup</p>
                                        <p className="text-sm text-gray-500">Daily at 2:00 AM</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Last Backup</p>
                                        <p className="text-sm text-gray-500">Today at 2:00 AM</p>
                                    </div>
                                    <Badge variant="secondary">Completed</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notification Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Bell className="h-5 w-5 mr-2" />
                                    Notifications
                                </CardTitle>
                                <CardDescription>Email and system notification settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Email Notifications</p>
                                        <p className="text-sm text-gray-500">Send email for important events</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Task Assignments</p>
                                        <p className="text-sm text-gray-500">Notify when tasks are assigned</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Status Changes</p>
                                        <p className="text-sm text-gray-500">Notify on workflow transitions</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* System Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Globe className="h-5 w-5 mr-2" />
                                System Information
                            </CardTitle>
                            <CardDescription>Current system version and environment details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 border rounded-lg">
                                    <p className="text-sm text-gray-500">Version</p>
                                    <p className="text-2xl font-bold">1.0.0</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <p className="text-sm text-gray-500">Environment</p>
                                    <p className="text-2xl font-bold">Development</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <p className="text-sm text-gray-500">API Version</p>
                                    <p className="text-2xl font-bold">v1</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
