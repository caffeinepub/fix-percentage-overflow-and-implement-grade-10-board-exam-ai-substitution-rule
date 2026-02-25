import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAssignUserRole } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { UserPlus, Shield, User as UserIcon } from 'lucide-react';
import { UserRole } from '../backend';

export default function UserManagement() {
  const [principalId, setPrincipalId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.user);
  const assignRoleMutation = useAssignUserRole();

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!principalId.trim()) {
      toast.error('Please enter a Principal ID');
      return;
    }

    try {
      await assignRoleMutation.mutateAsync({
        principal: principalId.trim(),
        role: selectedRole,
      });
      toast.success(`User role assigned successfully: ${selectedRole}`);
      setPrincipalId('');
      setSelectedRole(UserRole.user);
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast.error(error.message || 'Failed to assign role. Please check the Principal ID and try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          User Management
        </h2>
        <p className="text-muted-foreground">
          Assign roles to users in the application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign User Role
          </CardTitle>
          <CardDescription>
            Grant access to users by entering their Principal ID and assigning a role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAssignRole} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="principalId">Principal ID</Label>
              <Input
                id="principalId"
                type="text"
                placeholder="Enter user's Principal ID"
                value={principalId}
                onChange={(e) => setPrincipalId(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The Principal ID is obtained when a user logs in with Internet Identity
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as UserRole)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.user}>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span>User</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={UserRole.admin}>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedRole === UserRole.admin
                  ? 'Admins can assign roles and manage coding challenges'
                  : 'Users can add marks, view progress, and practice coding'}
              </p>
            </div>

            <Button
              type="submit"
              disabled={assignRoleMutation.isPending}
              className="w-full"
            >
              {assignRoleMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Assigning Role...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Role
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Get a Principal ID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">For New Users:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Ask the user to log in to the application using Internet Identity</li>
              <li>Once logged in, they can find their Principal ID in their browser's developer console</li>
              <li>Alternatively, you can use the identity.getPrincipal().toString() method to retrieve it</li>
              <li>Share the Principal ID with an admin to assign their role</li>
            </ol>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> After assigning a role, the user will be able to access the application features based on their assigned role. Users need to log in first before a role can be assigned.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
