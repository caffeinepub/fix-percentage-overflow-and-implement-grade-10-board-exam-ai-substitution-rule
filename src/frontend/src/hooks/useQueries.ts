import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AcademicEntry,
  AllGradesPercentages,
  BoardExamResults,
  CodingAttempt,
  CodingChallenge,
  ExportTypes,
  GradeAggregates,
  GradeAggregatesWithWeighting,
  SaveAcademicInput,
  UserProfile,
} from "../backend";
import { UserRole } from "../backend";
import { useActor } from "./useActor";

// ─── Academic Entries ────────────────────────────────────────────────────────

export function useGetAcademicEntries() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AcademicEntry[]>({
    queryKey: ["academicEntries"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAcademicEntries();
      } catch (err) {
        console.error("Failed to fetch academic entries:", err);
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useGetAcademicEntriesByGrade(grade: number) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AcademicEntry[]>({
    queryKey: ["academicEntries", "grade", grade],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAcademicEntriesByGrade(BigInt(grade));
      } catch (err) {
        console.error("Failed to fetch academic entries by grade:", err);
        throw err;
      }
    },
    enabled: !!actor && !actorFetching && grade > 0,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useGetAcademicEntriesByGradeAndTerm(
  grade: number,
  term: number,
) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AcademicEntry[]>({
    queryKey: ["academicEntries", "grade", grade, "term", term],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAcademicEntriesByGradeAndTerm(
          BigInt(grade),
          BigInt(term),
        );
      } catch (err) {
        console.error(
          "Failed to fetch academic entries by grade and term:",
          err,
        );
        throw err;
      }
    },
    enabled: !!actor && !actorFetching && grade > 0 && term > 0,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useAddAcademicEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<
    AcademicEntry[],
    Error,
    { grade: number; inputs: SaveAcademicInput[]; finalMarks?: number | null }
  >({
    mutationFn: async ({ grade, inputs, finalMarks }) => {
      if (!actor) throw new Error("Backend not available. Please try again.");
      return actor.addAcademicEntry(
        BigInt(grade),
        inputs,
        finalMarks != null ? BigInt(finalMarks) : null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicEntries"] });
      queryClient.invalidateQueries({ queryKey: ["gradeAggregates"] });
      queryClient.invalidateQueries({ queryKey: ["allGradePercentages"] });
      queryClient.invalidateQueries({ queryKey: ["weightedPercentages"] });
    },
  });
}

// ─── Board Exam ───────────────────────────────────────────────────────────────

export function useGetBoardExamResults() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<BoardExamResults | null>({
    queryKey: ["boardExamResults"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getBoardExamResults();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 30_000,
  });
}

export function useSaveBoardExamResults() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { boardExamTotal: number; maxMarks: number }>(
    {
      mutationFn: async ({ boardExamTotal, maxMarks }) => {
        if (!actor) throw new Error("Backend not available. Please try again.");
        return actor.saveBoardExamResults(
          BigInt(boardExamTotal),
          BigInt(maxMarks),
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["boardExamResults"] });
      },
    },
  );
}

// ─── Grade Aggregates ─────────────────────────────────────────────────────────

export function useGetGradeAggregatePercentages() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<GradeAggregates>({
    queryKey: ["gradeAggregates"],
    queryFn: async () => {
      if (!actor) return { aggregates: [] };
      try {
        return await actor.getGradeAggregatePercentages();
      } catch (err) {
        console.error("Failed to fetch grade aggregates:", err);
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useGetAllGradePercentages() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AllGradesPercentages>({
    queryKey: ["allGradePercentages"],
    queryFn: async () => {
      if (!actor) return { entries: [] };
      try {
        return await actor.getAllGradePercentages();
      } catch (err) {
        console.error("Failed to fetch all grade percentages:", err);
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useCalculateWeightedPercentages() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<GradeAggregatesWithWeighting>({
    queryKey: ["weightedPercentages"],
    queryFn: async () => {
      if (!actor) return { aggregates: [] };
      try {
        return await actor.calculateWeightedPercentages();
      } catch (err) {
        console.error("Failed to fetch weighted percentages:", err);
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
    staleTime: 30_000,
  });
}

// ─── Coding ───────────────────────────────────────────────────────────────────

export function useGetCodingAttempts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CodingAttempt[]>({
    queryKey: ["codingAttempts"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getCodingAttempts();
      } catch (err) {
        console.error("Failed to fetch coding attempts:", err);
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useGetAllCodingChallenges() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CodingChallenge[]>({
    queryKey: ["codingChallenges"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllCodingChallenges();
      } catch (err) {
        console.error("Failed to fetch coding challenges:", err);
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
    staleTime: 60_000,
  });
}

export function useSaveCodingAttempt() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<
    CodingAttempt,
    Error,
    { challengeId: number; code: string; result: string; score?: number | null }
  >({
    mutationFn: async ({ challengeId, code, result, score }) => {
      if (!actor) throw new Error("Backend not available. Please try again.");
      return actor.saveCodingAttempt(
        BigInt(challengeId),
        code,
        result,
        score != null ? BigInt(score) : null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codingAttempts"] });
    },
  });
}

export function useAddCodingChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<
    CodingChallenge,
    Error,
    {
      title: string;
      description: string;
      sampleInput: string;
      sampleOutput: string;
    }
  >({
    mutationFn: async ({ title, description, sampleInput, sampleOutput }) => {
      if (!actor) throw new Error("Backend not available. Please try again.");
      return actor.addCodingChallenge(
        title,
        description,
        sampleInput,
        sampleOutput,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codingChallenges"] });
    },
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getCallerUserProfile();
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 60_000,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, UserProfile>({
    mutationFn: async (profile) => {
      if (!actor) throw new Error("Backend not available. Please try again.");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Access Control ───────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 60_000,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      try {
        return await actor.getCallerUserRole();
      } catch {
        return UserRole.guest;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 60_000,
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { user: string; role: UserRole }>({
    mutationFn: async ({ user, role }) => {
      if (!actor) throw new Error("Backend not available. Please try again.");
      const { Principal } = await import("@dfinity/principal");
      const principal = Principal.fromText(user);
      return actor.assignCallerUserRole(principal, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["callerUserRole"] });
    },
  });
}

// ─── Data Export / Import ─────────────────────────────────────────────────────

export function useRetrieveDataExportRequest(exportType: string) {
  const { actor } = useActor();

  return useQuery<ExportTypes>({
    queryKey: ["dataExport", exportType],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.retrieveDataExportRequest(exportType);
      } catch (err) {
        console.error("Failed to retrieve export data:", err);
        throw err;
      }
    },
    enabled: false, // Only run on demand
    retry: false,
  });
}

export function useImportData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, ExportTypes>({
    mutationFn: async (data) => {
      if (!actor) throw new Error("Backend not available. Please try again.");
      return actor.importData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicEntries"] });
      queryClient.invalidateQueries({ queryKey: ["codingAttempts"] });
      queryClient.invalidateQueries({ queryKey: ["codingChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["gradeAggregates"] });
      queryClient.invalidateQueries({ queryKey: ["allGradePercentages"] });
      queryClient.invalidateQueries({ queryKey: ["weightedPercentages"] });
      queryClient.invalidateQueries({ queryKey: ["boardExamResults"] });
    },
  });
}
