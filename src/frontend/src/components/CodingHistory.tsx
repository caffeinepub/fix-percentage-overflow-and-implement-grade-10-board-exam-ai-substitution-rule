import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import {
  useGetAllCodingChallenges,
  useGetCodingAttempts,
} from "../hooks/useQueries";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingState } from "./LoadingState";

function formatTimestamp(ts: bigint): string {
  try {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleString();
  } catch {
    return "Unknown time";
  }
}

export default function CodingHistory() {
  const {
    data: attempts = [],
    isLoading: attemptsLoading,
    error: attemptsError,
    refetch: refetchAttempts,
  } = useGetCodingAttempts();

  const { data: challenges = [], isLoading: challengesLoading } =
    useGetAllCodingChallenges();

  const isLoading = attemptsLoading || challengesLoading;

  if (isLoading) {
    return <LoadingState message="Loading coding history..." />;
  }

  if (attemptsError) {
    return (
      <ErrorMessage
        message="Failed to load coding history. Please try again."
        onRetry={() => refetchAttempts()}
      />
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No coding attempts yet.</p>
        <p className="text-sm mt-1">
          Complete coding challenges to see your history here.
        </p>
      </div>
    );
  }

  const challengeMap = new Map(challenges.map((c) => [Number(c.id), c]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {attempts.length} attempt{attempts.length !== 1 ? "s" : ""} recorded
      </p>
      <Accordion type="multiple" className="space-y-2">
        {attempts.map((attempt) => {
          const challenge = challengeMap.get(Number(attempt.challengeId));
          const challengeTitle =
            challenge?.title ?? `Challenge #${Number(attempt.challengeId)}`;
          const score =
            attempt.score !== undefined && attempt.score !== null
              ? Number(attempt.score)
              : null;
          const attemptKey = `attempt-${Number(attempt.timestamp)}-${Number(attempt.challengeId)}`;

          return (
            <AccordionItem
              key={attemptKey}
              value={attemptKey}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-wrap items-center gap-2 text-left">
                  <span className="font-medium text-sm">{challengeTitle}</span>
                  {score !== null && (
                    <Badge variant={score >= 70 ? "default" : "secondary"}>
                      Score: {score}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(attempt.timestamp)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      CODE
                    </p>
                    <Card>
                      <CardContent className="p-3">
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                          {attempt.code || "(empty)"}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                  {attempt.result && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        OUTPUT
                      </p>
                      <Card>
                        <CardContent className="p-3">
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                            {attempt.result}
                          </pre>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
