import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, Loader2, UserCog } from "lucide-react";
import React, { useState } from "react";
import { UserRole } from "../backend";
import { useAssignCallerUserRole } from "../hooks/useQueries";
import { ErrorMessage } from "./ErrorMessage";

export default function UserManagement() {
  const [principalId, setPrincipalId] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.user);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const assignRole = useAssignCallerUserRole();

  const handleAssign = async () => {
    if (!principalId.trim()) return;
    setSuccessMessage(null);

    try {
      await assignRole.mutateAsync({
        user: principalId.trim(),
        role: selectedRole,
      });
      setSuccessMessage(
        `Successfully assigned role "${selectedRole}" to ${principalId.trim()}`,
      );
      setPrincipalId("");
    } catch (_err) {
      // Error is handled by mutation state
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            User Role Management
          </CardTitle>
          <CardDescription>
            Assign roles to users by entering their Principal ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              To find a user's Principal ID, ask them to log in and check their
              profile page. The Principal ID is a unique identifier for each
              Internet Identity user.
            </AlertDescription>
          </Alert>

          {assignRole.error && (
            <ErrorMessage
              message={
                assignRole.error instanceof Error
                  ? assignRole.error.message
                  : "Failed to assign role. Please check the Principal ID and try again."
              }
              onRetry={() => assignRole.reset()}
              retryLabel="Dismiss"
            />
          )}

          {successMessage && (
            <div className="text-sm text-green-600 dark:text-green-400 font-medium p-3 bg-green-50 dark:bg-green-950 rounded-md">
              ✓ {successMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="principal-id">Principal ID</Label>
            <Input
              id="principal-id"
              placeholder="e.g. aaaaa-aa or xxxxx-xxxxx-xxxxx-xxxxx-cai"
              value={principalId}
              onChange={(e) => setPrincipalId(e.target.value)}
              disabled={assignRole.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-select">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v as UserRole)}
              disabled={assignRole.isPending}
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.admin}>Admin</SelectItem>
                <SelectItem value={UserRole.user}>User</SelectItem>
                <SelectItem value={UserRole.guest}>Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAssign}
            disabled={!principalId.trim() || assignRole.isPending}
            className="w-full sm:w-auto"
          >
            {assignRole.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Role"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
