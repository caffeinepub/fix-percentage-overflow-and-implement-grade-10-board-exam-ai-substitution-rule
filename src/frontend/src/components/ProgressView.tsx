import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import React, { useState, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AcademicEntry } from "../backend";
import { useGetAcademicEntries } from "../hooks/useQueries";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingState } from "./LoadingState";

function getSubgroupLabel(entry: AcademicEntry): string | null {
  if (entry.scienceSubgroup) return entry.scienceSubgroup;
  if (entry.commerceSubgroup) return entry.commerceSubgroup;
  return null;
}

export default function ProgressView() {
  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useGetAcademicEntries();
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  const grades = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    const gradeSet = new Set(entries.map((e) => Number(e.grade)));
    return Array.from(gradeSet).sort((a, b) => a - b);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (selectedGrade === "all") return entries;
    return entries.filter(
      (e) => Number(e.grade) === Number.parseInt(selectedGrade),
    );
  }, [entries, selectedGrade]);

  const chartData = useMemo(() => {
    if (!filteredEntries || filteredEntries.length === 0) return [];
    return filteredEntries.map((entry, idx) => ({
      name: `G${Number(entry.grade)} T${Number(entry.term)}`,
      percentage: Number(entry.termPercentage),
      index: idx,
    }));
  }, [filteredEntries]);

  const stats = useMemo(() => {
    if (!filteredEntries || filteredEntries.length === 0) {
      return { avg: 0, highest: 0, lowest: 0, total: 0 };
    }
    const percentages = filteredEntries.map((e) => Number(e.termPercentage));
    return {
      avg: Math.round(
        percentages.reduce((a, b) => a + b, 0) / percentages.length,
      ),
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
      total: filteredEntries.length,
    };
  }, [filteredEntries]);

  if (isLoading) {
    return <LoadingState message="Loading academic entries..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load academic entries. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No academic entries yet.</p>
        <p className="text-sm mt-1">Add your marks to see progress here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="grade-filter"
          className="text-sm font-medium text-foreground"
        >
          Filter by Grade:
        </label>
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger id="grade-filter" className="w-36">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g} value={String(g)}>
                Grade {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-2xl font-bold text-primary">{stats.avg}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Highest</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.highest}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Lowest</p>
            <p className="text-2xl font-bold text-orange-500">
              {stats.lowest}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Frequency Polygon */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => [`${val}%`, "Percentage"]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marks Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => [`${val}%`, "Percentage"]} />
                <Bar
                  dataKey="percentage"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow
                    key={`${entry.grade}-${entry.term}-${Number(entry.timestamp)}`}
                  >
                    <TableCell>Grade {Number(entry.grade)}</TableCell>
                    <TableCell>Term {Number(entry.term)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <span>{entry.stream ?? "—"}</span>
                        {getSubgroupLabel(entry) && (
                          <Badge variant="secondary" className="text-xs">
                            {getSubgroupLabel(entry)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{Number(entry.termTotalMarks)}</TableCell>
                    <TableCell>{Number(entry.termMaxMarks)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          Number(entry.termPercentage) >= 75
                            ? "default"
                            : Number(entry.termPercentage) >= 50
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {Number(entry.termPercentage)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.gradeText}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
