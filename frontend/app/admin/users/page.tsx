"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, User, Role } from "@/services/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";

interface CreateUserForm {
  email: string;
  fullName: string;
  password: string;
  roleId: string;
}

interface EditUserForm {
  email: string;
  fullName: string;
  roleId: string;
}

const ROLE_ORDER: Role["name"][] = ["ADMIN", "SALES", "IMPLEMENTATION_LEAD", "HARDWARE_ENGINEER"];

const roleLabel = (roleName: Role["name"]) => {
  switch (roleName) {
    case "ADMIN":
      return "Administrator";
    case "SALES":
      return "Sales";
    case "IMPLEMENTATION_LEAD":
      return "Implementation Lead";
    case "HARDWARE_ENGINEER":
      return "Hardware Engineer";
    default:
      return roleName;
  }
};

export default function UsersPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const createForm = useForm<CreateUserForm>();
  const editForm = useForm<EditUserForm>();

  // Fetch users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
  });

  // Fetch roles (real role IDs from backend)
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: usersApi.getRoles,
  });

  const rolesByName = new Map((roles || []).map((r) => [r.name, r]));

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserForm) =>
      usersApi.createUser({
        email: userData.email,
        fullName: userData.fullName,
        password: userData.password,
        roleId: userData.roleId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateDialogOpen(false);
      createForm.reset();
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: EditUserForm }) => {
      return usersApi.updateUser(id, {
        email: userData.email,
        fullName: userData.fullName,
        roleId: userData.roleId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditDialogOpen(false);
      setEditingUser(null);
      editForm.reset();
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const handleCreateUser = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    editForm.reset({
      email: user.email,
      fullName: user.fullName,
      roleId: user.role.id,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = (data: EditUserForm) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData: data });
    }
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'SALES':
        return 'bg-blue-100 text-blue-800';
      case 'IMPLEMENTATION_LEAD':
        return 'bg-green-100 text-green-800';
      case 'HARDWARE_ENGINEER':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">Error loading users</h2>
              <p className="text-gray-600 mt-2">Please try again later</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-2">Manage system users and their roles</p>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system with appropriate role permissions.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...createForm.register('email', { required: true })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      {...createForm.register('fullName', { required: true })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...createForm.register('password', { required: true })}
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      onValueChange={(value) => createForm.setValue('roleId', value)}
                      disabled={rolesLoading || !roles?.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_ORDER.map((roleName) => {
                          const role = rolesByName.get(roleName);
                          if (!role) return null;
                          return (
                            <SelectItem key={role.id} value={role.id}>
                              {roleLabel(role.name)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users?.length || 0}</div>
              </CardContent>
            </Card>

            {ROLE_ORDER.map((roleName) => (
              <Card key={roleName}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{roleLabel(roleName)}</CardTitle>
                  <Badge variant="secondary" className={getRoleBadgeColor(roleName)}>
                    {users?.filter((u) => u.role.name === roleName).length || 0}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users?.filter((u) => u.role.name === roleName).length || 0}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                A list of all users in the system with their roles and permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading users...</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.email}</TableCell>
	                        <TableCell>
	                          <Badge className={getRoleBadgeColor(user.role.name)}>
	                            {roleLabel(user.role.name)}
	                          </Badge>
	                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.fullName}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user information and role permissions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-4">
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    {...editForm.register('email', { required: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fullName">Full Name</Label>
                  <Input
                    id="edit-fullName"
                    {...editForm.register('fullName', { required: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
	                  <Controller
	                    control={editForm.control}
	                    name="roleId"
	                    render={({ field }) => (
	                      <Select
	                        value={field.value}
	                        onValueChange={field.onChange}
	                        disabled={rolesLoading || !roles?.length}
	                      >
	                        <SelectTrigger>
	                          <SelectValue placeholder="Select a role" />
	                        </SelectTrigger>
	                        <SelectContent>
	                          {ROLE_ORDER.map((roleName) => {
	                            const role = rolesByName.get(roleName);
	                            if (!role) return null;
	                            return (
	                              <SelectItem key={role.id} value={role.id}>
	                                {roleLabel(role.name)}
	                              </SelectItem>
	                            );
	                          })}
	                        </SelectContent>
	                      </Select>
	                    )}
	                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditDialogOpen(false);
                      setEditingUser(null);
                      editForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
